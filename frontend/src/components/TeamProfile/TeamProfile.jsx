import React from "react";
import "./TeamProfile.css";
import mann from "../../assets/mann.jpeg";
import heli from "../../assets/heli.jpeg";
import divyang from "../../assets/divyang.jpeg";

const ProfileCard = () => {
  const teamMembers = [
    {
      name: "Mann Prajapati",
      role: "Team Leader & MernStack Developer",
      description: "Mann Prajapati leads NextEd AI with strong technical vision, driving full-stack development, AI integration, and scalable architecture while ensuring innovation, performance optimization, and seamless user experiences.",
      image: mann,
      socialLinks: [
        { icon: "linkedin", href: "https://www.linkedin.com/in/prajapatimann2502/" },
        { icon: "instagram", href: "https://www.instagram.com/mannprajapati.ai/" },
        { icon: "github", href: "https://github.com/MannPrajapati-Git" }
      ]
    },
    {
      name: "Heli Gandhi",
      role: "Frontend Developer & UI/UX Designer",
      description: "Heli Gandhi designs intuitive and responsive interfaces for NextEd AI, transforming complex concepts into engaging digital experiences through structured components, modern UI practices, and user-centered creativity.",
      image: heli,
      socialLinks: [
        { icon: "linkedin", href: "https://www.linkedin.com/in/heligandhi4114" },
        { icon: "instagram", href: "https://www.instagram.com/_4114heli/" },
        { icon: "github", href: "https://github.com/HeliGandhi-Git" }
      ]
    },
    {
      name: "Divyang Solanki",
      role: "Backend Developer",
      description: "Divyang Solanki develops secure backend systems for NextEd AI, building robust APIs, managing databases efficiently, and optimizing server performance to deliver reliable, scalable, and high-quality learning platforms.",
      image: divyang,
      socialLinks: [
        { icon: "linkedin", href: "https://www.linkedin.com/in/divyang-solanki-b5037a2a3/" },
        { icon: "instagram", href: "https://www.instagram.com/divyang__solanki__04/" },
        { icon: "github", href: "https://github.com/Divyang20040709" }
      ]
    }
  ];

  const SocialIcon = ({ icon, href }) => {
    const icons = {
      linkedin: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      ),
      instagram: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
        </svg>
      ),
      github: (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
        </svg>
      )
    };

    return (
      <a href={href} className="social-icon" target="_blank" rel="noopener noreferrer" aria-label={icon}>
        {icons[icon]}
      </a>
    );
  };

  return (
    <div className="team-wrapper">
      <div className="team-container">
        {/* Header */}
        <div className="section-header">
          <h1 className="section-title">Meet Our Team</h1>
          <p className="section-subtitle">The minds behind NextEd AI</p>
        </div>

        {/* Team Grid */}
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card">
              {/* Photo Container */}
              <div className="photo-container">
                <img
                  src={member.image}
                  alt={member.name}
                  className="profile-photo"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/140?text=' + member.name.charAt(0);
                  }}
                />
              </div>

              {/* Member Info */}
              <h2 className="member-name">{member.name}</h2>
              <p className="member-role">{member.role}</p>
              <p className="member-desc">{member.description}</p>

              {/* Social Icons */}
              <div className="social-icons">
                {member.socialLinks.map((social, socialIndex) => (
                  <SocialIcon
                    key={socialIndex}
                    icon={social.icon}
                    href={social.href}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
