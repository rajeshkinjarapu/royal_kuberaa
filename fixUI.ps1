$appPath = "d:\My Apps\Royal Kuberaa\mlm_webapp\src\App.jsx"
$content = Get-Content $appPath -Raw

$dialogJsx = @"
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
"@

$lastReturnIndex = $content.LastIndexOf("return (")
if ($lastReturnIndex -ge 0) {
    $beforeReturn = $content.Substring(0, $lastReturnIndex)
    $afterReturn = $content.Substring($lastReturnIndex + 8) # length of "return ("
    
    $content = $beforeReturn + "return (`n    <>" + $dialogJsx + $afterReturn
    
    $lastClosingIndex = $content.LastIndexOf(");")
    if ($lastClosingIndex -ge 0) {
        $beforeClosing = $content.Substring(0, $lastClosingIndex)
        $afterClosing = $content.Substring($lastClosingIndex + 2)
        $content = $beforeClosing + "    </>`n  );" + $afterClosing
    }
}

Set-Content $appPath $content -NoNewline
