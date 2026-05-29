import React from 'react';

export default function ServicesSection() {
  return (
    <>
<section id="services" style={{ padding: "36px 5%", background: "var(--white)", overflow: "hidden" }}>
  <div className="text-center" style={{ marginBottom: "28px" }}>
    <div className="section-tag">What We Offer</div>
    <h2 className="section-h2">Our Services</h2>
    <p className="section-p" style={{ margin: "0 auto" }}>World-class medical services delivered with compassion, precision, and care — available 24/7 for you and your family.</p>
  </div>

  
  <div className="services-track-wrap">
    <div className="services-track" id="servicesTrack">

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
            <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
          </svg>
        </div>
        <h4>Pharmacy Services</h4>
        <p>In-house pharmacy stocked with all prescribed and OTC medicines. Fast dispensing with pharmacist consultation available round the clock.</p>
        <span className="svc-tag">24/7 Available</span>
      </div>

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3v11l-4 5h14l-4-5V3"/>
            <line x1="9" y1="3" x2="15" y2="3"/>
            <path d="M6.5 17.5h11"/><circle cx="8" cy="14" r="0.8" fill="currentColor"/>
            <circle cx="12" cy="15.5" r="0.8" fill="currentColor"/>
          </svg>
        </div>
        <h4>Laboratory Services</h4>
        <p>State-of-the-art diagnostic lab with rapid turnaround. Blood tests, biopsies, cultures and over 500 panel tests with digital report delivery.</p>
        <span className="svc-tag">500+ Tests</span>
      </div>

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="7" width="15" height="11" rx="1"/>
            <path d="M16 10h4l3 3v4h-7V10z"/>
            <circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/>
            <line x1="6" y1="11" x2="6" y2="15"/><line x1="4" y1="13" x2="8" y2="13"/>
          </svg>
        </div>
        <h4>Ambulance Services</h4>
        <p>Advanced life-support ambulances with trained paramedics available 24/7. GPS-tracked fleet ensuring the fastest response to emergencies.</p>
        <span className="svc-tag">24/7 Emergency</span>
      </div>

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <h4>Emergency Care</h4>
        <p>Round-the-clock emergency department staffed with senior consultants, trauma specialists, and resuscitation-ready critical care teams.</p>
        <span className="svc-tag">Always Open</span>
      </div>

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="2.5"/>
            <path d="M10.5 10.5L21 21"/>
            <line x1="14" y1="6" x2="20" y2="6"/><line x1="14" y1="9" x2="18" y2="9"/>
            <line x1="14" y1="15" x2="20" y2="15"/><line x1="14" y1="18" x2="18" y2="18"/>
          </svg>
        </div>
        <h4>Diagnostic Services</h4>
        <p>Full-spectrum imaging including MRI, CT, PET, X-Ray, Ultrasound and mammography — powered by AI-assisted reporting for faster results.</p>
        <span className="svc-tag">AI-Powered</span>
      </div>

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            <line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/>
          </svg>
        </div>
        <h4>ICU & Critical Care</h4>
        <p>Level-III ICU with continuous monitoring, ventilator support and a dedicated critical care team ensuring the highest survival outcomes.</p>
        <span className="svc-tag">Level III ICU</span>
      </div>

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
            <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
          </svg>
        </div>
        <h4>Online Appointment</h4>
        <p>Book consultations instantly online, choose your specialist, time slot and department — confirmed within minutes via SMS and email.</p>
        <span className="svc-tag">Instant Booking</span>
      </div>

      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6 8 4 12.5 4 15a8 8 0 0 0 16 0c0-2.5-2-7-8-13z"/>
            <line x1="12" y1="12" x2="12" y2="17"/><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"/>
          </svg>
        </div>
        <h4>Blood Bank Services</h4>
        <p>NABH-certified blood bank with component separation, cross-matching, rare blood group registry and 24/7 emergency blood supply.</p>
        <span className="svc-tag">NABH Certified</span>
      </div>

      
      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
            <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
          </svg>
        </div>
        <h4>Pharmacy Services</h4>
        <p>In-house pharmacy stocked with all prescribed and OTC medicines. Fast dispensing with pharmacist consultation available round the clock.</p>
        <span className="svc-tag">24/7 Available</span>
      </div>
      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3v11l-4 5h14l-4-5V3"/>
            <line x1="9" y1="3" x2="15" y2="3"/>
            <path d="M6.5 17.5h11"/><circle cx="8" cy="14" r="0.8" fill="currentColor"/>
            <circle cx="12" cy="15.5" r="0.8" fill="currentColor"/>
          </svg>
        </div>
        <h4>Laboratory Services</h4>
        <p>State-of-the-art diagnostic lab with rapid turnaround. Blood tests, biopsies, cultures and over 500 panel tests with digital report delivery.</p>
        <span className="svc-tag">500+ Tests</span>
      </div>
      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="7" width="15" height="11" rx="1"/>
            <path d="M16 10h4l3 3v4h-7V10z"/>
            <circle cx="5.5" cy="18.5" r="1.5"/><circle cx="18.5" cy="18.5" r="1.5"/>
            <line x1="6" y1="11" x2="6" y2="15"/><line x1="4" y1="13" x2="8" y2="13"/>
          </svg>
        </div>
        <h4>Ambulance Services</h4>
        <p>Advanced life-support ambulances with trained paramedics available 24/7. GPS-tracked fleet ensuring the fastest response to emergencies.</p>
        <span className="svc-tag">24/7 Emergency</span>
      </div>
      
      <div className="svc-card">
        <div className="svc-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <h4>Emergency Care</h4>
        <p>Round-the-clock emergency department staffed with senior consultants, trauma specialists and resuscitation-ready critical care teams.</p>
        <span className="svc-tag">Always Open</span>
      </div>

    </div>
  </div>
</section>
    </>
  );
}
