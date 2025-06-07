#!/usr/bin/env node

function calculateReimbursement(tripDays, miles, receipts) {
    const days = parseInt(tripDays);
    const milesTraveled = parseFloat(miles);
    const receiptAmount = parseFloat(receipts);
    
    // Data-driven approach: best simple formula found through systematic analysis
    // days*95 + miles*0.6 + receipts*0.35 had lowest average error (239.13)
    let reimbursement = days * 95 + milesTraveled * 0.6 + receiptAmount * 0.35;
    
    // Small adjustments based on patterns found in the data
    const milesPerDay = milesTraveled / days;
    const spendingPerDay = receiptAmount / days;
    
    // Adjustment for very short trips (1-2 days) - they tend to get higher per-day rates
    if (days <= 2) {
        reimbursement += days * 10; // Bonus for short trips
    }
    
    // Adjustment for very long trips (12+ days) - they tend to get lower per-day rates
    if (days >= 12) {
        reimbursement -= days * 8; // Penalty for very long trips
    }
    
    // Efficiency adjustment - high miles per day gets slight bonus
    if (milesPerDay > 100) {
        reimbursement += days * 3;
    }
    
    // Receipt adjustment for extreme cases
    if (receiptAmount > 1500 && days >= 5) {
        // High receipts on medium+ trips get reduced treatment
        reimbursement -= (receiptAmount - 1500) * 0.1;
    }
    
    if (receiptAmount < 50 && days >= 3) {
        // Very low receipts get slight penalty
        reimbursement -= 20;
    }
    
    // Small variance based on deterministic hash
    const hash = (days * 7 + Math.floor(milesTraveled) * 11 + Math.floor(receiptAmount * 100) * 13) % 20;
    reimbursement += (hash - 10) * 1.5;
    
    return Math.round(reimbursement * 100) / 100;
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length !== 3) {
        console.error('Usage: node calculate_reimbursement.js <trip_duration_days> <miles_traveled> <total_receipts_amount>');
        process.exit(1);
    }
    
    const [tripDays, miles, receipts] = args;
    const result = calculateReimbursement(tripDays, miles, receipts);
    
    console.log(result);
}

module.exports = { calculateReimbursement };