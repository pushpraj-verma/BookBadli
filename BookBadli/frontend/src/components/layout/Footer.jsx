import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Mail, Phone, MapPin, Github, Twitter, Facebook, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    platform: [
      { name: 'Browse Books', href: '/books' },
      { name: 'Nearby Books', href: '/books/nearby' },
      { name: 'How It Works', href: '#' },
      { name: 'Community Guidelines', href: '#' }
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Contact Support', href: '#' },
      { name: 'Safety Tips', href: '#' },
      { name: 'Report Issue', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'Disclaimer', href: '#' }
    ]
  }

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#', color: 'hover:text-blue-600' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-sky-500' },
    { name: 'GitHub', icon: Github, href: '#', color: 'hover:text-gray-900' }
  ]

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold">BookBadli</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Connect with book lovers, exchange books without money, and build your dream library through our community-driven platform.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-400 mb-6">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>support@bookbadli.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className={`text-gray-400 transition-colors duration-200 ${social.color}`}
                    aria-label={social.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="font-semibold text-white mb-2">Stay Updated</h3>
              <p className="text-gray-400 text-sm">
                Get notified about new books and features in your area.
              </p>
            </div>
            
            <div className="flex w-full md:w-auto max-w-sm">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-r-none"
              />
              <Button className="rounded-l-none bg-blue-600 hover:bg-blue-700">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © {currentYear} BookBadli. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-4 text-gray-400 text-sm">
            <span>Made with ❤️ for book lovers</span>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <Button
        onClick={scrollToTop}
        size="sm"
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-40"
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </footer>
  )
}

export default Footer