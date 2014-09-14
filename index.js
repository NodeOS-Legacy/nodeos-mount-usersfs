#!/usr/bin/env node

var fs = require('fs')

var spawn = require('child_process').spawn

var errno = require('src-errno');
var mount = require('src-mount');


function mkdirMount(dev, path, type, flags, extras)
{
  if(typeof flags == 'string')
  {
    extras = flags
    flags = undefined
  }

  flags = flags || null
  extras = extras || ''

  try
  {
    fs.mkdirSync(path)
//    fs.mkdirSync(path, '0000')
  }
  catch(error)
  {
    if(error.code != 'EEXIST') throw error
  }

  var res = mount.mount(dev, path, type, flags, extras);
  if(res == -1) console.error('Error '+errno.getErrorString()+' while mounting',path)
  return res
}

function execInit(HOME)
{
  var homeStat = fs.statSync(HOME)

  const initPath = HOME+'/init'

  try
  {
    var initStat = fs.statSync(initPath)
  }
  catch(exception)
  {
    return initPath+' not found'
  }

  if(!initStat.isFile())
    return initPath+' is not a file';

  if(homeStat.uid != initStat.uid || homeStat.gid != initStat.gid)
    return HOME+" uid & gid don't match with its init"

  // Update env with user variables
  var env =
  {
    HOME: HOME,
    PATH: HOME+'/bin:/usr/bin',
    __proto__: process.env
  }

  // Start user's init
  spawn(initPath, [],
  {
    cwd: HOME,
    stdio: 'inherit',
    env: env,
    detached: true,
    uid: homeStat.uid,
    gid: homeStat.gid
  });
}


var USERS = process.env.USERS
if(USERS)
{
  var dev  = USERS;
  var path = '/home';
  var type = 'ext4';

  var res = mkdirMount(dev, path, type);

  if(res == 0)
  {
    delete process.env.USERS

    spawn('forever-starter', [],
    {
      stdio: 'inherit',
      detached: true
    });

    return fs.readdir(path, function(err, files)
    {
      if(err) return console.warn(err)

      files.forEach(function(file)
      {
        const HOME = path+'/'+file

        fs.stat(HOME, function(err, stats)
        {
          if(err) return console.warn(err)

          if(!stats.isDirectory())
            return console.warn(HOME+' is not a directory');

          var error = execInit(HOME)
          if(error)
            console.warn(error)
        })
      })
    })
  }
}
else
  console.warning('USERS filesystem not defined')


// Error booting, enable REPL

console.log('Starting REPL session')

require("repl").start("NodeOS-usersfs> ").on('exit', function()
{
  console.log('Got "exit" event from repl!');
  process.exit(2);
});
