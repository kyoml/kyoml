const kyoml     = require('../dist')
const fs        = require('fs')
const path      = require('path')
const axios     = require('axios');

(async function () {

  const json = await kyoml.compile(
    fs.readFileSync(path.join(__dirname, 'sample.kyo')).toString(),
    {
      async: true,
      directives: {
        read: ({ root, get, value, set }) => {
          set(get('document.' + value))
        },
        schema: ({ value }, sch) => {
          for (const prop in sch) {
            if (typeof value[prop] !== sch[prop]) {
              throw new Error(`Invalid schema, ${prop} should be a ${sch[prop]}`)
            }
          }
        }
      },
      mappers: {
        fetch: async (url) => {
          const { data } = await axios.get(url);
          return data;
        },
        mapBy: (arr, key) => {
          return arr.map(it => it[key])
        }
      }
    }
  );

  console.log(json);
})();
