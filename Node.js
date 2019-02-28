language: node_js
node_js:
  - "0.8"
  - "0.10"
  - "0.12"
  - "1.8"
  - "2.5"
  - "3.3"
  - "4.9"
  - "5.12"
  - "6.15"
  - "7.10"
  - "8.14"
  - "9.11"
  - "10.15"
  - "11.6"
sudo: false
cache:
  directories:
    - node_modules
before_install:
  - |
    # Setup utility functions
    function node_version_lt () {
      [[ "$(v "$TRAVIS_NODE_VERSION")" -lt "$(v "${1}")" ]]
    }
    function npm_module_installed () {
      npm -lsp ls | grep -Fq "$(pwd)/node_modules/${1}:${1}@"
    }
    function npm_remove_module_re () {
      node -e '
        fs = require("fs");
        p = JSON.parse(fs.readFileSync("package.json", "utf8"));
        r = RegExp(process.argv[1]);
        for (k in p.devDependencies) {
          if (r.test(k)) delete p.devDependencies[k];
        }
        fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
      ' "$@"
    }
    function npm_use_module () {
      node -e '
        fs = require("fs");
        p = JSON.parse(fs.readFileSync("package.json", "utf8"));
        p.devDependencies[process.argv[1]] = process.argv[2];
        fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
      ' "$@"
    }
    function v () {
      tr '.' '\n' <<< "${1}" \
        | awk '{ printf "%03d", $0 }' \
        | sed 's/^0*//'
    }
  # Configure npm
  - |
    # Skip updating shrinkwrap / lock
    npm config set shrinkwrap false
  # Setup Node.js version-specific dependencies
  - |
    # Configure eslint for linting
    if node_version_lt '6.0'; then npm_remove_module_re '^eslint(-|$)'
    fi
  - |
    # Configure istanbul for coverage
    if node_version_lt '0.10'; then npm_remove_module_re '^istanbul$'
    fi
  - |
    # Configure mocha for testing
    if   node_version_lt '0.10'; then npm_use_module 'mocha' '2.5.3'
    elif node_version_lt '4.0' ; then npm_use_module 'mocha' '3.5.3'
    fi
  - |
    # Configure supertest for http calls
    if   node_version_lt '0.10'; then npm_use_module 'supertest' '1.1.0'
    elif node_version_lt '4.0' ; then npm_use_module 'supertest' '2.0.0'
    fi
  # Update Node.js modules
  - |
    # Prune & rebuild node_modules
    if [[ -d node_modules ]]; then
      npm prune
      npm rebuild
    fi
before_scrpt:
  - |
    # Contents of node_modules
    npm -s ls ||:
script:
  - |
    # Run test script, depending on istanbul install
    if npm_module_installed 'istanbul'; then npm run-script test-ci
    else npm test
    fi
  - |
    # Run linting, if eslint exists
    if npm_module_installed 'eslint'; then npm run-script lint
    fi
after_script:
  - |
    # Upload coverage to coveralls if exists
    if [[ -f ./coverage/lcov.info ]]; then
      npm install --save-dev coveralls@2
      coveralls < ./coverage/lcov.info
    fi
