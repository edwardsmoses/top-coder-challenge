#!/usr/bin/env node

function calculateReimbursement(tripDays, miles, receipts) {
    const days = parseInt(tripDays);
    const milesTraveled = parseFloat(miles);
    const receiptAmount = parseFloat(receipts);
    
    // Best base formula from analysis: days*90 + miles*0.65 + receipts*0.3
    // Average error: 227.18 - this is already very good!
    let reimbursement = days * 90 + milesTraveled * 0.65 + receiptAmount * 0.3;
    
    // Very minimal adjustments to avoid overengineering
    
    // Small bonus for very short trips
    if (days === 1) {
        reimbursement += 5;
    }
    
    // Small penalty for very long trips  
    if (days >= 14) {
        reimbursement -= 10;
    }
    
    // Handle the extreme outliers with more precise negative factors
    const spendingPerDay = receiptAmount / days;
    const milesPerDay = milesTraveled / days;
    
    // Only apply negative adjustments to the most extreme cases
    if (days >= 8 && spendingPerDay > 200 && receiptAmount > 1500) {
        // Very specific high spending long trips
        reimbursement -= receiptAmount * 0.15;
    } else if (days >= 12 && spendingPerDay > 100 && receiptAmount > 1000) {
        // Very long trips with high receipts
        reimbursement -= receiptAmount * 0.1;
    } else if (days === 1 && milesPerDay > 1000 && receiptAmount > 1500) {
        // Extreme single-day cases
        reimbursement -= receiptAmount * 0.05;
    }
    
    // Very small variance
    const hash = (days * 3 + Math.floor(milesTraveled) * 7 + Math.floor(receiptAmount * 100) * 11) % 10;
    reimbursement += (hash - 5) * 2;
    
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