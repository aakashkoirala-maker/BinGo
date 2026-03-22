const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', '..', 'src', 'components', 'admin', 'AdminDashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Ensure icons are imported
if (!content.includes('FaCheckCircle')) {
    content = content.replace('import { ', 'import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTimes, ');
}

// 2. Add Toast State
if (!content.includes('const [toast, setToast]')) {
    const stateAnchor = 'const [stats, setStats] = useState({';
    const toastState = `    // Toast Notification System
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };\n\n    `;
    content = content.replace(stateAnchor, toastState + stateAnchor);
}

// 3. Add Toast Component in the return JSX before final </div>
if (!content.includes('Toast Notification Component')) {
    const toastJSX = `
            {/* Toast Notification Component */}
            {toast.show && (
                <div className={\`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 \${
                    toast.type === 'success' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                        : toast.type === 'error'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                }\`}>
                    <div className="text-xl">
                        {toast.type === 'success' ? <FaCheckCircle /> : toast.type === 'error' ? <FaTimesCircle /> : <FaInfoCircle />}
                    </div>
                    <p className="font-medium">{toast.message}</p>
                    <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 text-white hover:text-gray-200 transition-colors">
                        <FaTimes />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;`;

// Using regex to replace the final lines safely
const finalReplacementRegex = /\s*<\/div>\s*\);\s*};\s*export default AdminDashboard;/g;
content = content.replace(finalReplacementRegex, toastJSX);
}

// 4. Transform all alert() calls
content = content.replace(/alert\((.*?)\);/g, (match, msg) => {
    let type = "'success'";
    if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('could not') || msg.toLowerCase().includes('please')) {
        type = "'error'";
    } else if (msg.toLowerCase().includes('notice') || msg.toLowerCase().includes('sure')) {
        type = "'info'";
    }
    return `showToast(${msg}, ${type});`;
});

fs.writeFileSync(file, content);
console.log('Successfully added custom Toast and replaced alerts in AdminDashboard.jsx!');
