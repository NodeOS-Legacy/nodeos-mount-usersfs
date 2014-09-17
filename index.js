#!/usr/bin/env node

var fs = require('fs')

var spawn = require('child_process').spawn

var utils = require('nodeos-mount-utils');


function startRepl(error)
{
  console.warn(error)

  utils.startRepl('NodeOS-usersfs')
}


// Mount users filesystem

var envDev = 'USERS'
var path   = '/home';
var type   = 'ext4' //process.env.ROOTFSTYPE || 'auto';
var extras = '';

utils.mountfs(envDev, path, type, extras, function(error)
{
  if(!error)
  {
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
