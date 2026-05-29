import React from 'react';

export default function AwardsSection() {
  return (
    <>
<section className="achievement-section" id="awards">
    <div className="container">
        <div className="section-head center">
            <span className="section-tag">ACHIEVEMENTS</span>
            <h2 className="section-h2">Awards & Recognition</h2>
            <p className="section-p">
                Trusted by healthcare professionals and recognized for excellence in patient care,
                innovation, and digital healthcare transformation.
            </p>
        </div>

        <div className="achievement-grid">

            <div className="achievement-card">
                <div className="ach-icon">🏆</div>
                <h3>Best Digital Healthcare Platform</h3>
                <p>Recognized for innovation in smart hospital management systems and healthcare automation.</p>
            </div>

            <div className="achievement-card">
                <div className="ach-icon">⭐</div>
                <h3>99% Patient Satisfaction</h3>
                <p>Achieved outstanding patient satisfaction through advanced healthcare services and care quality.</p>
            </div>

            <div className="achievement-card">
                <div className="ach-icon">🛡️</div>
                <h3>NABH Quality Standards</h3>
                <p>Maintaining international healthcare quality and safety standards across hospital operations.</p>
            </div>

            <div className="achievement-card">
                <div className="ach-icon">💙</div>
                <h3>1 Million+ Patient Records Managed</h3>
                <p>Securely managing millions of healthcare records with intelligent HMS technology.</p>
            </div>

        </div>
    </div>
</section>
    </>
  );
}
