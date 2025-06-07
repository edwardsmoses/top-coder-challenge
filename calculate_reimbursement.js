#!/usr/bin/env node

function calculateReimbursement(tripDays, miles, receipts) {
    const days = parseInt(tripDays);
    const milesTraveled = parseFloat(miles);
    const receiptAmount = parseFloat(receipts);
    
    // Base formula that performed best in analysis: $100/day + $0.58/mile + receipts
    let reimbursement = days * 100 + milesTraveled * 0.58 + receiptAmount;
    
    // Add small adjustments based on patterns
    // Slightly higher rate for certain trip lengths
    if (days === 2) {
        reimbursement += 5; // Small bonus for 2-day trips
    } else if (days === 3) {
        reimbursement += 10; // Bonus for 3-day trips
    } else if (days >= 5) {
        reimbursement += 15; // Bonus for longer trips
    }
    
    // Mileage adjustment for very high mileage
    if (milesTraveled > 100) {
        const extraMiles = milesTraveled - 100;
        reimbursement += extraMiles * 0.2; // Additional rate for high mileage
    }
    
    // Receipt adjustment based on amount
    if (receiptAmount > 20) {
        reimbursement += receiptAmount * 0.15; // Bonus for substantial receipts
    }
    
    // Small randomization to match observed variance
    const hashSeed = (days * 3 + Math.floor(milesTraveled) * 7 + Math.floor(receiptAmount * 100) * 11) % 10;
    const variance = (hashSeed - 5) * 2; // Small +/- adjustment
    reimbursement += variance;
    
    // Round to 2 decimal places
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