#!/usr/bin/env node

function calculateReimbursement(tripDays, miles, receipts) {
    const days = parseInt(tripDays);
    const milesTraveled = parseFloat(miles);
    const receiptAmount = parseFloat(receipts);
    
    // Different per-day rates based on trip length
    let perDayRate = 100; // Default rate
    
    if (days >= 14) {
        perDayRate = 60; // Very long trips get heavily reduced rate
    } else if (days >= 12) {
        perDayRate = 70; // Long trips get reduced rate
    } else if (days >= 10) {
        perDayRate = 80; // Medium-long trips get slightly reduced rate
    } else if (days >= 8) {
        perDayRate = 90; // Slightly reduced for 8-9 day trips
    }
    
    // Base calculation
    let reimbursement = days * perDayRate + milesTraveled * 0.58;
    
    // Receipt processing - this is where the "bug" lives
    let receiptContribution = 0;
    const spendingPerDay = receiptAmount / days;
    
    // Check for the "small receipt penalty" bug
    // If receipts are very small relative to the trip, apply negative factor
    if (receiptAmount < 100 && spendingPerDay < 25) {
        // Very small receipts get penalized
        receiptContribution = receiptAmount * -1.5;
    } else if (receiptAmount < 50 && days >= 8) {
        // Small receipts on long trips get heavily penalized
        receiptContribution = receiptAmount * -0.8;
    } else if (days >= 8) {
        // Long trip logic (as before)
        if (spendingPerDay < 100) {
            receiptContribution = receiptAmount * 0.46;
        } else if (spendingPerDay < 150) {
            receiptContribution = receiptAmount * 0.35;
        } else if (spendingPerDay < 200) {
            receiptContribution = receiptAmount * 0.29;
        } else if (spendingPerDay < 250) {
            receiptContribution = receiptAmount * 0.25;
        } else if (spendingPerDay < 300) {
            receiptContribution = receiptAmount * 0.22;
        } else {
            receiptContribution = receiptAmount * 0.18;
        }
    } else {
        // Short trip logic - but check for small receipt penalty first
        if (receiptAmount < 20 && days <= 3) {
            // Small receipts on short trips get negative treatment
            receiptContribution = receiptAmount * -0.5;
        } else if (receiptAmount < 100) {
            receiptContribution = receiptAmount * 0.2;
        } else if (receiptAmount < 500) {
            receiptContribution = receiptAmount * 0.4;
        } else if (receiptAmount < 1000) {
            receiptContribution = receiptAmount * 0.5;
        } else if (receiptAmount < 1500) {
            receiptContribution = receiptAmount * 0.43;
        } else if (receiptAmount < 2000) {
            receiptContribution = receiptAmount * 0.32;
        } else {
            receiptContribution = receiptAmount * 0.23;
        }
    }
    
    reimbursement += receiptContribution;
    
    // Efficiency bonus
    const milesPerDay = milesTraveled / days;
    if (milesPerDay >= 50 && milesPerDay <= 150) {
        reimbursement += days * 5; // Small efficiency bonus
    }
    
    // Sweet spot bonus for 5-day trips
    if (days === 5) {
        reimbursement += 30;
    }
    
    // Small variance
    const hash = (days * 5 + Math.floor(milesTraveled) * 7 + Math.floor(receiptAmount * 100) * 3) % 30;
    reimbursement += (hash - 15) * 1.2;
    
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