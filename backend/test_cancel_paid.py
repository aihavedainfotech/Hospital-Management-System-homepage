"""
Test script to diagnose why paid appointment cancellation fails
Run this to see the exact error
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from hp_src.config.database import db
from hp_src.modules.appointments.model import Appointment

def test_cancel_paid_appointment():
    """Find a paid appointment and try to cancel it"""
    
    print("=" * 70)
    print("DIAGNOSTIC: Testing Paid Appointment Cancellation")
    print("=" * 70)
    
    # Find a paid appointment
    query = """
        SELECT id, patient_name, doctor_name, payment_status, payment_amount, appointment_date
        FROM appointments 
        WHERE payment_status = 'paid' 
        AND status != 'cancelled'
        LIMIT 1
    """
    
    appt = db.execute_query(query, fetch_all=False)
    
    if not appt:
        print("\n✗ No paid appointments found to test")
        print("\nLet's check what payment statuses exist:")
        status_query = "SELECT DISTINCT payment_status, COUNT(*) FROM appointments GROUP BY payment_status"
        statuses = db.execute_query(status_query)
        for s in statuses:
            print(f"  - payment_status = '{s['payment_status']}': {s['count']} appointments")
        return
    
    print(f"\n✓ Found paid appointment to test:")
    print(f"  ID: {appt['id']}")
    print(f"  Patient: {appt['patient_name']}")
    print(f"  Doctor: {appt['doctor_name']}")
    print(f"  Payment Status: {appt['payment_status']}")
    print(f"  Payment Amount: {appt['payment_amount']}")
    print(f"  Date: {appt['appointment_date']}")
    
    print(f"\n→ Attempting to cancel appointment {appt['id']}...")
    print("-" * 70)
    
    try:
        result = Appointment.cancel_and_move(appt['id'], "TEST CANCELLATION - DIAGNOSTIC")
        
        if result:
            print("\n" + "=" * 70)
            print("✓ SUCCESS! Paid appointment cancelled successfully")
            print("=" * 70)
            
            # Check if it's in appointments_cancelled
            check_query = "SELECT id, refund_status, payment_status FROM appointments_cancelled WHERE id = %s"
            cancelled = db.execute_query(check_query, (appt['id'],), fetch_all=False)
            
            if cancelled:
                print(f"\n✓ Found in appointments_cancelled table:")
                print(f"  refund_status: {cancelled.get('refund_status')}")
                print(f"  payment_status: {cancelled.get('payment_status')}")
            
            # Check if removed from appointments
            check_appt = db.execute_query("SELECT id FROM appointments WHERE id = %s", (appt['id'],), fetch_all=False)
            if not check_appt:
                print(f"\n✓ Removed from appointments table (MOVE successful)")
            else:
                print(f"\n✗ WARNING: Still exists in appointments table")
                
        else:
            print("\n" + "=" * 70)
            print("✗ FAILED! Cancellation returned False")
            print("=" * 70)
            print("\nCheck the DEBUG output above for the error")
            
    except Exception as e:
        print("\n" + "=" * 70)
        print("✗ EXCEPTION OCCURRED!")
        print("=" * 70)
        print(f"\nError: {e}")
        import traceback
        print("\nFull traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    test_cancel_paid_appointment()
