import { Link } from "react-router-dom";
import { Award, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Award className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display text-xl font-bold">CertifyPro</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Empowering B.Tech students with industry-recognized skill certifications. 
              Boost your career with verified credentials.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/certificates" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Browse Certificates
                </Link>
              </li>
              <li>
                <Link to="/verify" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                  Register Now
                </Link>
              </li>
            </ul>
          </div>

          {/* Certificates */}
          <div>
            <h4 className="font-display font-semibold mb-4">Certifications</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-primary-foreground/70">Web Development</li>
              <li className="text-primary-foreground/70">Python Programming</li>
              <li className="text-primary-foreground/70">Data Science</li>
              <li className="text-primary-foreground/70">AI & Machine Learning</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-primary-foreground/70">
                <Mail className="w-4 h-4" />
                support@certifypro.com
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70">
                <Phone className="w-4 h-4" />
                +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Education Hub, Tech City</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-sm text-primary-foreground/50">
          <p>© {new Date().getFullYear()} CertifyPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
