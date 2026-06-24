const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf-8');

const replaced = content.replace(
  `        )}

      </main>`,
  `        )}
        </div>
      </main>`
);

fs.writeFileSync('src/App.tsx', replaced);
console.log('closed div');
