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


// Mount users filesystem

var envDev = 'USERS'
var path   = '/home';
var type   = 'ext4' //process.env.ROOTFSTYPE || 'auto';
var flags  = utils.flags.MS_NODEV | utils.flags.MS_NOSUID;
var extras = '';

utils.mountfs(envDev, path, type, flags, extras, function(error)
{
  if(!error)
  {
    var path   = '/root';
    var flags  = mount.flags.MS_REMOUNT | mount.flags.MS_RDONLY;

    var res = mount.mount('', path, '', flags);
    if(res == -1) console.error('Error while re-mounting '+path+' as read-only')

    spawn('forever-starter', [],
    {
      stdio: 'inherit',
      detached: true
    })
    .on('error', startRepl)

    return fs.readdir(path, function(error, files)
    {
      if(error) return startRepl(error)

      files.forEach(function(file)
      {
        const HOME = path+'/'+file

        fs.stat(HOME, function(err, stats)
        {
          if(err) return console.warn(err)

          if(!stats.isDirectory())
            return console.warn(HOME+' is not a directory');

          var error = utils.execInit(HOME)
          if(error)
            console.warn(error)
        })
      })
    })
  }

  // Error mounting the users filesystem, enable REPL

  startRepl(error)
})
