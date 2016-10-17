'use strict';
const _ = require('lodash');
const spawn = require('child_process').spawn;
const { app, ipcMain } = require('electron');
const Config = require('electron-config');
const Convert = require('ansi-to-html');
// const runCmd = require('./run_cmd');
const pty = require('pty.js');

const convert = new Convert();
const config = new Config();

function guid() {
  return 'xyxyxyxy'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

// Ensure immutable, don't know if config.get always returns new data.
let cmds = _.cloneDeep(config.get('cmds') || []);
for (const c of cmds) {
  c.outputs = [];
}

const cmdHash = {};
cmds.forEach(cmd => cmdHash[cmd.id] = cmd); // eslint-disable-line

process.on('exit', () => {
  for (const cmd of cmds) {
    if (cmd.process) {
      process.kill(-cmd.process.pid);
    }
  }
});

/* ==================== Get Init Data ============================== */
ipcMain.on('GET_INIT_DATA', (evt) => {
  evt.sender.send('SET_INIT_DATA', {
    appVersion: app.getVersion(),
    cmds: cmds.map(c => Object.assign(_.pick(c, ['id', 'name', 'cmd', 'cwd', 'outputs', 'url']), { status: c.process ? 'running' : 'stopped' })),
  });
});


/* ==================== Save Command ============================== */
ipcMain.on('SAVE_CMD', (evt, data, cmdId) => {
  console.log('saving cmd');
  const cmd = { id: cmdId || guid() };
  Object.assign(cmd, {
    name: data.name,
    cmd: data.cmd,
    cwd: data.cwd || null,
    url: data.url || null,
  });
  const newCmds = config.get('cmds') || [];
  if (cmdId) {
    const i = newCmds.findIndex(c => c.id === cmdId);
    newCmds.splice(i, 1, cmd);
  } else {
    newCmds.push(cmd);
  }
  config.set('cmds', newCmds);

  // Notify UI
  const curr = cmdId ? cmds.find(c => c.id === cmdId) : { status: 'stopped', outputs: [] };
  Object.assign(curr, cmd);
  if (!cmdId) {
    cmds.push(curr);
  }

  cmdHash[cmd.id] = curr;
  evt.sender.send('SAVE_CMD_SUCCESS', cmd);
});

/* ==================== Delete Command ============================== */
ipcMain.on('DELETE_CMD', (evt, cmdId) => {
  console.log('deleting cmd');
  // Stop the process if needed
  const cmd = cmdHash[cmdId];
  if (cmd.process) {
    try {
      process.kill(-cmd.process.pid);
    } catch(e) {} // eslint-disable-line
  }
  // Save to config
  const newCmds = config.get('cmds') || [];
  _.remove(newCmds, c => c.id === cmdId);
  config.set('cmds', newCmds);

  // Remove from store
  _.remove(cmds, c => c.id === cmdId);
  delete cmdHash[cmdId];

  evt.sender.send('DELETE_CMD_SUCCESS', cmdId);
});

/* ==================== Reorder Commands ============================== */
ipcMain.on('REORDER_CMDS', (evt, cmdIds) => {
  console.log('reordering cmds');

  // Save to config
  let newCmds = config.get('cmds') || [];
  const groups = _.groupBy(newCmds, 'id');
  newCmds = cmdIds.map(id => groups[id][0]);
  config.set('cmds', newCmds);

  // Update store order
  for (let i = 0; i < cmds.length; i++) {
    cmds[i] = cmdHash[cmdIds[i]];
  }

  evt.sender.send('REORDER_CMDS_SUCCESS', cmdIds);
});

/* ==================== Run Command ============================== */
ipcMain.on('RUN_CMD2', (evt, cmdId) => {
  const cmd = cmdHash[cmdId];
  if (cmd.process) {
    // prevent from running multiple times.
    return;
  }
  const arr = cmd.cmd.split(' ').filter(item => !!item);
  const target = arr.shift();
  const child = spawn(target, arr, {
    cwd: cmd.cwd,
    stdio: 'pipe',
    detached: true,
  });

  evt.sender.send('RUN_CMD_SUCCESS', cmdId);

  child.stdout.pipe(process.stdout);
  cmd.process = child;

  let lineId = 0;
  cmd.outputs.length = 0;
  function onData(chunk) {
    const out = chunk.toString('utf8');
    for (const line of out.split('\n')) {
      if (cmd.outputs.length >= 10) cmd.outputs.unshift();
      cmd.outputs.push({
        id: `${cmdId}_${lineId++}`, //eslint-disable-line
        text: line,
      });
    }
    evt.sender.send('CMD_OUTPUT', cmdId, [].concat(cmd.outputs));
  }
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);

  child.on('exit', (code) => {
    delete cmd.process;
    evt.sender.send('CMD_FINISHED', cmdId, code);
  });

  child.on('error', (error) => {
    delete cmd.process;
    evt.sender.send('CMD_FINISHED', cmdId, 99, error);
  });
});

/* ==================== Run Command with pty.js ============================== */
ipcMain.on('RUN_CMD', (evt, cmdId) => {
  console.log('running cmd: ', cmdId);
  const cmd = cmdHash[cmdId];
  if (cmd.process) {
    // prevent from running multiple times.
    return;
  }

  const arr = cmd.cmd.split(' ').filter(item => !!item);
  const target = arr.shift();
  // const child = spawn(target, arr, {
  //   cwd: cmd.cwd,
  //   stdio: 'pipe',
  //   detached: true,
  // });

  const term = pty.spawn(target, arr, {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: cmd.cwd || process.env.HOME,
    detached: true,
    env: process.env
  });

  term.on('data', function(chunk) {
    const out = chunk.toString('utf8');
    for (const line of out.split('\n')) {
      if (cmd.outputs.length >= 10) cmd.outputs.unshift();
      cmd.outputs.push({
        id: `${cmdId}_${lineId++}`, //eslint-disable-line
        text: line,
      });
    }
    evt.sender.send('CMD_OUTPUT', cmdId, [].concat(cmd.outputs));
  });

  term.on('exit', (code) => {
    delete cmd.process;
    evt.sender.send('CMD_FINISHED', cmdId, code);
  });

  cmd.process = term;

});

/* ==================== Stop Command ============================== */
ipcMain.on('STOP_CMD', (evt, cmdId) => {
  console.log('stopping cmd: ', cmdId);
  const cmd = cmdHash[cmdId];
  if (cmd.process) {
    process.kill(-cmd.process.pid);
  }
});
