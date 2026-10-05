const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'mlm_webapp', 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// Replace alert( with window.customAlert(
content = content.replace(/\balert\(/g, 'window.customAlert(');

// Replace window.confirm( with await window.customConfirm(
content = content.replace(/window\.confirm\(/g, 'await window.customConfirm(');

// Now we need to inject the dialogController setup at the top, and the component inside App.
// Find the imports
const controllerCode = `
let dialogController = null;

window.customAlert = (message) => {
    if (dialogController) {
        dialogController.show(message, 'alert');
    } else {
        window.alert(message);
    }
};

window.customConfirm = (message) => {
    return new Promise((resolve) => {
        if (dialogController) {
            dialogController.show(message, 'confirm', resolve);
        } else {
            resolve(window.confirm(message));
        }
    });
};
`;

// Insert controllerCode after the imports
content = content.replace(/(import .*;\n)+/, (match) => match + '\n' + controllerCode + '\n');

// Find the App function declaration
const appFuncRegex = /(function App\(\) \{|const App = \(\) => \{)/;
const stateCode = `
  const [dialogState, setDialogState] = useState({ isOpen: false, message: '', type: 'alert', resolvePromise: null });

  useEffect(() => {
      dialogController = {
          show: (message, type, resolvePromise = null) => {
              setDialogState({ isOpen: true, message, type, resolvePromise });
          },
          hide: () => setDialogState(prev => ({ ...prev, isOpen: false }))
      };
  }, []);

  const handleDialogConfirm = () => {
      if (dialogState.resolvePromise) dialogState.resolvePromise(true);
      if (dialogController) dialogController.hide();
  };

  const handleDialogCancel = () => {
      if (dialogState.resolvePromise) dialogState.resolvePromise(false);
      if (dialogController) dialogController.hide();
  };
`;
content = content.replace(appFuncRegex, (match) => match + '\n' + stateCode);

// Find the main return statement of App to inject the dialog JSX
// We can just append it before the final closing tag of the App, or before the return.
// Better: find `return (` at the end of the App function and wrap the content.
// Since App returns a router, let's just find `</Router>` and inject before it, wait, `Router` might be wrapped in something. 
// App returns `<div className="app-container"> ... </div>` at the top level or `<Router>...</Router>`.
// Let's inject it right inside the very last div or right before closing `</Router>`.
// Let's find `return (` inside App, actually, let's just put it as a sibling to the Router by wrapping it in a Fragment.

// The return statement is `return (\n    <Router>`
const dialogJsx = `
      {dialogState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#FFF', borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: dialogState.type === 'confirm' ? '#FEF3C7' : '#E0E7FF', color: dialogState.type === 'confirm' ? '#D97706' : '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
                    {dialogState.type === 'confirm' ? '?' : '!'}
                </div>
                <h3 style={{ margin: '0 0 12px 0', color: '#0F172A', fontSize: '22px', fontWeight: '800' }}>{dialogState.type === 'confirm' ? 'Confirmation' : 'Notice'}</h3>
                <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.5', marginBottom: '32px' }}>{dialogState.message}</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    {dialogState.type === 'confirm' && (
                        <button onClick={handleDialogCancel} style={{ flex: 1, padding: '14px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s' }}>Cancel</button>
                    )}
                    <button onClick={handleDialogConfirm} style={{ flex: dialogState.type === 'confirm' ? 1 : 'none', minWidth: dialogState.type === 'alert' ? '140px' : 'auto', padding: '14px', background: '#0B1437', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(11, 20, 55, 0.2)' }}>OK</button>
                </div>
            </div>
            <style>
            {\`
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            \`}
            </style>
        </div>
      )}
`;

// Replace `return (` with `return (\n    <>\n      ${dialogJsx}` and the final `  );\n}` with `    </>\n  );\n}`
// Wait, we need to be careful with the exact match.
// Let's replace the first `return (` in the App function.
// Since it's a huge file, `return (` might match something inside.
// In App.jsx, the main return is:
/*
  return (
    <Router>
      <div className="app-container">
*/
content = content.replace(/return \(\s*<Router>/, 'return (\n    <>\n' + dialogJsx + '\n      <Router>');
content = content.replace(/<\/Router>\s*\);\n\}$/, '</Router>\n    </>\n  );\n}');

fs.writeFileSync(appPath, content);
console.log('Successfully injected Custom Alerts');
