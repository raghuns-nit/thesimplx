
// Tile Quantity Estimator Logic
function calculateTiles(e) {
    e.preventDefault();
    
    // Room Dimensions
    const rL = parseFloat(document.getElementById('roomL').value);
    const rB = parseFloat(document.getElementById('roomB').value);
    const rUnit = document.getElementById('roomUnit').value;
    
    // Tile Dimensions
    const tL = parseFloat(document.getElementById('tileL').value);
    const tB = parseFloat(document.getElementById('tileB').value);
    const tUnit = document.getElementById('tileUnit').value;
    
    // Conversion factors to mm
    const toMM = {
        'mm': 1,
        'cm': 10,
        'inch': 25.4,
        'feet': 304.8
    };
    
    // Convert everything to mm
    const rL_mm = rL * toMM[rUnit];
    const rB_mm = rB * toMM[rUnit];
    const tL_mm = tL * toMM[tUnit];
    const tB_mm = tB * toMM[tUnit];
    
    // Areas in mm^2
    const roomArea = rL_mm * rB_mm;
    const tileArea = tL_mm * tB_mm;
    
    // Calculation
    const exactTiles = roomArea / tileArea;
    const wastage = exactTiles * 0.10;
    const totalTiles = Math.ceil(exactTiles + wastage);
    
    // Convert Area to Sq.Ft for display
    const roomAreaSqFt = (roomArea / (304.8 * 304.8)).toFixed(2);
    
    // Display Results
    document.getElementById('res_roomArea').innerText = `${roomAreaSqFt} Sq.Ft`;
    document.getElementById('res_exactTiles').innerText = exactTiles.toFixed(1);
    document.getElementById('res_wastage').innerText = wastage.toFixed(1) + " (10%)";
    document.getElementById('res_total').innerText = totalTiles + " Pieces";
    
    document.getElementById('estimatorResult').classList.remove('hidden');
}
