var zlib = require('zlib');
var compileForms = require('./compile-forms-task');
var upsertForms = require('./upsert-forms-task');
var seeds = require('./seeds-task');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      dist: {
        files: {
          'dist/js/app.js': [],
          'dist/js/preload.js': ['./app/js/preload']
        },
        options: {
          transform: [require('./versionXform')],
          browserifyOptions: { extensions: [ '.coffee', '.js' ] },
          alias: [
            './app/js/run.coffee:run',
            './app/js/forms:forms',
            './app/js/jquery-shim:jquery',
            './app/js/lodash-shim:lodash',
            './app/js/lodash-shim:underscore',
            './app/js/backbone-shim:backbone'
            ]
        }
      }
    },

    concat: {
      libscss: {
        src: ['vendor/bootstrap/css/bootstrap.min.css',
              'vendor/*.css',
              'vendor/leaflet/leaflet.css'],
        dest: 'dist/css/libs.css'
      },
      css: {
          src: ['app/css/*.css'],
          dest: 'dist/css/app.css'
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      libsjs: {
        files: {
          // the files to uglify
          'dist/js/libs.js': 
            ['bower_components/jquery/dist/jquery.min.js', 
            'bower_components/lodash/dist/lodash.min.js', 
            'bower_components/backbone/backbone.js', 
            'vendor/bootstrap/js/bootstrap.min.js',  // Custom bootstrap with larger fonts
            'bower_components/handlebars/handlebars.runtime.min.js',
            'bower_components/swag/lib/swag.min.js',
            'bower_components/overthrow-dist/overthrow.js',
            'vendor/mobiscroll.custom-2.5.4.min.js',
            'vendor/jquery.scrollintoview.min.js',
            'vendor/leaflet/leaflet-src.js']
        }
      }
    },

    copy: {
      apphtml: {
        expand: true,
        cwd: 'app/html/',
        src: '*',
        dest: 'dist/'
      },
      appimages: {
        expand: true,
        cwd: 'app/img/',
        src: '*',
        dest: 'dist/img/'
      },
      libbootstrapfonts: {
        expand: true,
        cwd: 'vendor/bootstrap/fonts/',
        src: '*',
        dest: 'dist/fonts/'
      },
      libimages: {
        expand: true,
        cwd: 'vendor/img/',
        src: '*',
        dest: 'dist/img/'
      },
      // leafletimages: { We don't use default marker
      //   expand: true,
      //   cwd: 'vendor/leaflet/images/',
      //   src: '*',
      //   dest: 'dist/img/leaflet/'
      // },
      leafletcssimages: {
        expand: true,
        cwd: 'vendor/leaflet/images/',
        src: 'layers*',
        dest: 'dist/css/images/'
      },
      cordova_www: {
        expand: true,
        cwd: 'dist/',
        src: '**',
        dest: 'cordova/www/'
      },  
      cordova_override_debug: {
        expand: true,
        cwd: 'app/cordova/debug/',
        src: '**',
        dest: 'cordova/www/'
      },
      cordova_override_release: {
        expand: true,
        cwd: 'app/cordova/release/',
        src: '**',
        dest: 'cordova/www/'
      },
      distgz : {
        expand: true,
        cwd: 'dist/',
        src: '**',
        dest: 'distgz/'
      }
    },

    manifest: {
      generate: {
        options: {
          basePath: 'dist/',
          network: ['*'],
          preferOnline: true,
          verbose: true,
          timestamp: true
        },
        src: [
          '*.html',
          'js/*.js',
          'css/*.css',
          'css/images/*.*',
          'img/*.*',
          'fonts/*'
        ],
        dest: 'dist/manifest.appcache'
      }
    },

    shell: {
      bump_version: {
        command: 'npm version patch',
        options: {
          stdout: true,
          failOnError: true
        }
      },
      deploy_demo: {
        command: 's3cmd sync --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          '* s3://demo.mwater.co',
        options: {
          stdout: true,
          execOptions: {
            cwd: 'dist.gz'
          }
        }
      },
      deploy_beta2: {
        command: 's3cmd sync --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          '* s3://beta2.mwater.co',
        options: {
          stdout: true,
          execOptions: {
            cwd: 'dist.gz'
          }
        }
      },      
      deploy_map: {
        command: ['s3cmd sync --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          '* s3://map.mwater.co',
          's3cmd sync --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          '* s3://map.mwater.org'].join("&&"),
        options: {
          stdout: true,
          execOptions: {
            cwd: 'dist.gz'
          }
        }
      },
      deploy_app: {
        command: [
          's3cmd sync --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          '* s3://app.mwater.co',
          's3cmd put --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, no-store, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          'manifest.appcache s3://app.mwater.org',
          's3cmd sync --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          '* s3://app.mwater.org',
          's3cmd put --acl-public --guess-mime-type ' +
          '--add-header "Cache-Control: no-cache, no-store, must-revalidate" ' +
          '--add-header "Pragma: no-cache" ' +
          '--add-header "Expires: 0" ' + 
          '--add-header "Content-Encoding: gzip" '+
          'manifest.appcache s3://app.mwater.org'
        ].join('&&'),
        options: {
          stdout: true,
          execOptions: {
              cwd: 'dist.gz'
          }
        }
      },
      cordova_run: {
        command: 'cordova -d run',
        options: {
          stdout: true,
          execOptions: {
            cwd: 'cordova'
          }
        }
      } 
    },

    watch: {
      scripts: {
        files: ['app/**/*.*'],
        tasks: ['default']
      }
    },

    compress: {
      main: {
        options: {
          mode: 'gzip'
        },
       files: [
          {expand: true,  cwd: 'dist/', src: ['**'], dest: 'dist.gz/'}
        ]
      }
    }, 

    replace: {
      // Reload sometimes uses cached versions of js on update. Add timestamp
      html_js_timestamps: {
        src: ['dist/*.html'],
        overwrite: true,                 // overwrite matched source files
        replacements: [{ 
          from: /_=timestamp/g,
          to: "_=<%= new Date().getTime() %>"
        }]
      }
    }
  });

  //grunt.registerTask('browserify', 'Make single file output', browserify);
  grunt.registerTask('upsert-forms', 'Upsert forms to server', upsertForms);
  grunt.registerTask('compile-forms', 'Make forms into js', compileForms);
  grunt.registerTask('seeds', 'Seed database with some tables', seeds);

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('cordova_debug', ['copy:cordova_www', 'copy:cordova_override_debug']);
  grunt.registerTask('cordova_release', ['copy:cordova_www', 'copy:cordova_override_release']);
  grunt.registerTask('run_cordova_debug', ['default', 'cordova_debug', 'shell:cordova_run']);

  grunt.registerTask('copy-app', ['copy:apphtml', 'replace:html_js_timestamps', 'copy:appimages', 'copy:libimages', 'copy:libbootstrapfonts', 'copy:leafletcssimages']);
  grunt.registerTask('default', ['browserify', 'seeds', 'concat', 'uglify', 'copy-app', 'manifest', 'compress']);

  grunt.registerTask('deploy_demo', ['default', 'shell:deploy_demo']);
  grunt.registerTask('deploy_map', ['default', 'shell:deploy_map']);
  grunt.registerTask('deploy_app', ['shell:bump_version', 'default', 'shell:deploy_app']);
  grunt.registerTask('deploy', ['deploy_app', 'shell:deploy_demo', 'shell:deploy_map']);
};
