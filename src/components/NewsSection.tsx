import React from 'react';

export default function NewsSection() {
  return (
    <>
<section className="news-section" id="news">
    <div className="container">
        <div className="section-head center">
            <span className="section-tag">LATEST NEWS</span>
            <h2 className="section-h2">Hospital News & Updates</h2>
            <p className="section-p">
                Stay updated with the latest healthcare innovations, medical camps,
                technology upgrades, and patient care initiatives at Haveda Hospital.
            </p>
        </div>

        <div className="news-grid">

            <div className="news-card">
                <div className="news-img">
                    <img src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=1200&auto=format&fit=crop" alt="Medical News" />
                </div>
                <div className="news-content">
                    <span className="news-date">May 2026</span>
                    <h3>AI-Based Smart Patient Monitoring Introduced</h3>
                    <p>
                        Haveda Hospital launches intelligent monitoring systems for better patient safety,
                        real-time alerts, and predictive healthcare management.
                    </p>
                    <a href="#" className="news-link">Read More</a>
                </div>
            </div>

            <div className="news-card">
                <div className="news-img">
                    <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1200&auto=format&fit=crop" alt="Hospital Update" />
                </div>
                <div className="news-content">
                    <span className="news-date">April 2026</span>
                    <h3>Free Mega Health Camp Successfully Conducted</h3>
                    <p>
                        Over 5,000 patients benefited from our multi-speciality health camp
                        including diagnostics, consultations, and wellness programs.
                    </p>
                    <a href="#" className="news-link">Read More</a>
                </div>
            </div>

            <div className="news-card">
                <div className="news-img">
                    <img src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop" alt="Healthcare Technology" />
                </div>
                <div className="news-content">
                    <span className="news-date">March 2026</span>
                    <h3>Digital Healthcare Transformation Initiative</h3>
                    <p>
                        Advanced HMS workflows, telemedicine support, and secure digital records
                        improve operational efficiency and patient experience.
                    </p>
                    <a href="#" className="news-link">Read More</a>
                </div>
            </div>

        </div>
    </div>
</section>
    </>
  );
}
