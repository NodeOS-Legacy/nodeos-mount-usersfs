#!/usr/bin/env node

var fs = require('fs')

var spawn = require('child_process').spawn

var utils = require('nodeos-mount-utils');
var mount = require('src-mount');


function startRepl(error)
{
  console.warn(error)

  utils.startRepl('NodeOS-usersfs')
}

exports.startRepl = startRepl;


function exec(command, args)
{
  spawn(command, args || [],
  {
    stdio: 'inherit',
    detached: true
  })
  .on('error', startRepl)
  .unref();
}


// Mount users filesystem

var envDev = 'USERS'
var path   = '/home';
var type   = 'ext4' //process.env.ROOTFSTYPE || 'auto';
var flags  = utils.flags.MS_NODEV | utils.flags.MS_NOSUID;
var extras = '';

utils.mountfs(envDev, path, type, flags, extras, function(error)
{
  // Error mounting the users filesystem, enable REPL
  if(error) return startRepl(error)

  // Re-mount /root as read-only
  var rootfspath = '/root';
  var flags      = mount.flags.MS_REMOUNT | mount.flags.MS_RDONLY;

//  var res = mount.mount('', rootfspath, '', flags, '');
//  if(res == -1) console.error('Error re-mounting '+rootfspath+' as read-only')

  // Start global system services
  exec('forever-starter');

  // Start users services
  exec('forever', ['start', '-m', '1', 'bin/users-services', path]);

  // Start command given as parameter
  if(process.argv.length > 2)
  {
    try
    {
      fs.statSync('/.dockerinit')
    }
    catch(error)
    {
      if(error.code != 'ENOENT') throw error
      return
    }

    exec(process.argv[2], process.argv.splice(3));
  }
})
