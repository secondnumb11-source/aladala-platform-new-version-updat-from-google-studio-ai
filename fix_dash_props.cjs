const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// I'll just find the exact text
const oldDashboard = `<Dashboard 
                cases={employeeFilteredCases}
                clients={employeeFilteredClients}
                invoices={invoices}
                tasks={tasks}
                hearings={hearings}
                selectedRole={selectedRole}
                onNavigate={setCurrentTab}
                onSelectCase={(cs) => {
                  setSelectedCase(cs);
                  setCurrentTab('cases');
                }}
                onUpdateState={handleUpdateState}
              />`;

const newDashboard = `<Dashboard 
                cases={employeeFilteredCases}
                clients={employeeFilteredClients}
                invoices={invoices}
                tasks={tasks}
                hearings={hearings}
                onNavigate={setCurrentTab}
                currentUser={currentUser}
              />`;

content = content.replace(oldDashboard, newDashboard);
fs.writeFileSync('src/App.tsx', content);
console.log('fixed dashboard props');
