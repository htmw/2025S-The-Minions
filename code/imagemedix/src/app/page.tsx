import React from "react";
import { 
  Zap, 
  Shield, 
  LayoutGrid, 
  Brain,
  CheckCircle, 
  Upload, 
  Microscope, 
  ClipboardCheck, 
  Stethoscope,
  Github,
  Globe,
  Lock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-900 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <nav className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-indigo-600 flex items-center justify-center text-white">
                <Brain size={20} />
              </div>
              <span className="text-xl font-bold">
                <span className="text-indigo-500">Image</span>Medix
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-gray-400">
              <Link href="#features" className="text-sm hover:text-white transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-sm hover:text-white transition-colors">How It Works</Link>
              <Link href="#get-started" className="text-sm hover:text-white transition-colors">Get Started</Link>
              <Link href="#contact" className="text-sm hover:text-white transition-colors">Contact</Link>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="#get-started"
                className="hidden sm:flex text-sm text-gray-300 hover:text-white transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="#sign-in"
                className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/20 flex items-center gap-1.5"
              >
                Sign In <ArrowRight size={14} />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 bg-indigo-950/60 text-indigo-300 text-sm py-1 px-3 rounded-full mb-2 w-fit">
                <Lock size={12} />
                <span className="font-medium">HIPAA Compliant</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                AI-Powered Medical<br className="hidden sm:block" /> Image Diagnostics
              </h1>
              
              <p className="text-gray-400 text-lg sm:pr-10">
                Rapid and accurate detection of pneumonia and brain tumors through advanced AI technology, 
                supporting healthcare professionals in making timely decisions.
              </p>
              
              <div className="flex flex-wrap gap-3 mt-2">
                <Link
                  href="#contact"
                  className="rounded-full bg-indigo-600 text-white px-6 py-3 font-medium hover:bg-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2"
                >
                  <Zap size={18} />
                  Get Started
                </Link>
                <Link
                  href="#learn-more"
                  className="rounded-full border border-gray-800 px-6 py-3 font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
                >
                  Learn More <ArrowRight size={16} />
                </Link>
              </div>
              

            </div>
            
            {/* Hero Visualization */}
            <div className="relative h-[400px] rounded-xl overflow-hidden border border-gray-800/70 bg-gradient-to-br from-gray-900 to-gray-950 shadow-xl shadow-indigo-500/5">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-900/10 z-0"></div>
              
              {/* Decorative elements */}
              <div className="absolute top-6 right-6 h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl"></div>
              <div className="absolute bottom-10 left-10 h-16 w-16 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl"></div>
              
              <div className="z-10 p-6 text-center absolute inset-0 flex flex-col items-center justify-center">
                <div className="inline-block mb-6 p-4 bg-indigo-600/20 rounded-full">
                  <Brain size={36} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Advanced Neural Network</h3>
                <p className="text-gray-400 mb-6 max-w-xs mx-auto">
                  Using deep learning technology to analyze medical images with precision
                </p>
                
                <div className="w-full max-w-xs bg-gray-800/50 h-2 rounded-full mb-2">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full" style={{ width: "94%" }}></div>
                </div>
                <div className="text-sm text-gray-400 mb-8">
                  Processing complete: <span className="text-indigo-400 font-medium">94%</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                  <div className="h-2 w-full bg-indigo-600/40 rounded-full"></div>
                  <div className="h-2 w-full bg-indigo-600/60 rounded-full"></div>
                  <div className="h-2 w-full bg-indigo-600/80 rounded-full"></div>
                </div>
              </div>
              
              <div className="absolute bottom-5 left-5 right-5 bg-gray-900/90 backdrop-blur-md p-4 rounded-lg z-20 border border-gray-800/80 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Analysis Complete</div>
                    <div className="font-medium">Pneumonia detected (95.8% confidence)</div>
                  </div>
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 bg-gray-900/30" id="features">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-indigo-950/60 text-indigo-300 text-sm py-1 px-3 rounded-full mb-4">
                <Zap size={12} />
                <span className="font-medium">POWERFUL FEATURES</span>
              </div>
              <h2 className="text-3xl font-bold">
                Advanced <span className="text-indigo-500">Capabilities</span>
              </h2>
              <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                ImageMedix combines cutting-edge AI technology with a user-friendly interface to deliver exceptional diagnostic support.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-5 group-hover:bg-indigo-600/30 transition-colors">
                  <Zap size={22} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Rapid Diagnostics</h3>
                <p className="text-gray-400">
                  Analysis completed in seconds, not hours, allowing for immediate treatment decisions when time is critical.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-5 group-hover:bg-indigo-600/30 transition-colors">
                  <Shield size={22} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">High Accuracy</h3>
                <p className="text-gray-400">
                  Diagnostic accuracy exceeding 90% for pneumonia and brain tumors, comparable to specialist performance.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-gray-900 p-6 rounded-xl border border-gray-800/50 hover:border-indigo-500/50 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center mb-5 group-hover:bg-indigo-600/30 transition-colors">
                  <LayoutGrid size={22} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Unified Platform</h3>
                <p className="text-gray-400">
                  Single system for analyzing multiple types of medical images, eliminating the need for separate diagnostic tools.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How it Works Section */}
        <section className="py-20" id="how-it-works">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-indigo-950/60 text-indigo-300 text-sm py-1 px-3 rounded-full mb-4">
                <Brain size={12} />
                <span className="font-medium">SEAMLESS PROCESS</span>
              </div>
              <h2 className="text-3xl font-bold">
                How <span className="text-indigo-500">ImageMedix</span> Works
              </h2>
              <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                Our streamlined workflow ensures quick and accurate results with minimal effort from your team.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-indigo-600/20 relative z-10">
                  <Upload size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-center">Upload Medical Scan</h3>
                <p className="text-gray-400 text-center">
                  Upload X-rays, CT scans, or MRI images to the secure platform.
                </p>
                
                {/* Connecting line */}
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
              </div>
              
              {/* Step 2 */}
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-indigo-600/20 relative z-10">
                  <Microscope size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-center">AI Analysis</h3>
                <p className="text-gray-400 text-center">
                  Neural networks analyze the images for signs of pneumonia or brain tumors.
                </p>
                
                {/* Connecting line */}
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
              </div>
              
              {/* Step 3 */}
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-indigo-600/20 relative z-10">
                  <ClipboardCheck size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-center">Receive Results</h3>
                <p className="text-gray-400 text-center">
                  Get detailed analysis with confidence scores and highlighted regions.
                </p>
                
                {/* Connecting line */}
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-5 shadow-lg shadow-indigo-600/20">
                  <Stethoscope size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3 text-center">Make Decisions</h3>
                <p className="text-gray-400 text-center">
                  Use AI-supported insights to make faster, more informed treatment decisions.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Get Started Section */}
        <section className="py-20 bg-gray-900/30" id="get-started">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 sm:p-10 rounded-2xl border border-gray-800/70 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-600/30 rounded-full flex items-center justify-center mb-6">
                  <Zap size={28} className="text-indigo-400" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Transform Healthcare</h2>
                <p className="text-gray-400 max-w-2xl mb-8">
                  Experience the power of our AI diagnostic system in your healthcare facility. Start using ImageMedix today and see how quickly and accurately our system can identify pneumonia and brain tumors.
                </p>
                <Link
                  href="#get-started"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2"
                >
                  <Zap size={18} />
                  Get Started Now
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        {/* Vision Section */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-indigo-950/60 text-indigo-300 text-sm py-1 px-3 rounded-full mb-4">
                <Shield size={12} />
                <span className="font-medium">OUR MISSION</span>
              </div>
              <h2 className="text-3xl font-bold">
                Our <span className="text-indigo-500">Vision</span> for Healthcare
              </h2>
              <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                We're committed to advancing medical diagnostics through artificial intelligence and machine learning.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-800/50 hover:border-indigo-500/30 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-indigo-500" />
                  Technology Objectives
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <CheckCircle size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-300">
                      Develop a unified neural network architecture that can process multiple types of medical imaging
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <CheckCircle size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-300">
                      Achieve diagnostic accuracy comparable to medical specialists
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <CheckCircle size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-300">
                      Create an accessible interface for healthcare professionals to utilize the technology
                    </p>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-900 p-8 rounded-xl border border-gray-800/50 hover:border-indigo-500/30 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Zap size={20} className="text-indigo-500" />
                  Future Applications
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <CheckCircle size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-300">
                      Extend the AI model to detect additional medical conditions
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <CheckCircle size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-300">
                      Integration with existing healthcare systems and electronic medical records
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 flex-shrink-0">
                      <CheckCircle size={16} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-300">
                      Deployment in resource-limited settings to enhance diagnostic capabilities
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-gray-900/30" id="contact">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-8 sm:p-10 rounded-2xl shadow-2xl shadow-indigo-500/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to transform your diagnostic capabilities?</h2>
                  <p className="text-indigo-100 max-w-xl">
                    Contact our team to learn more about ImageMedix or request a demonstration for your healthcare facility.
                  </p>
                </div>
                <Link
                  href="#contact-form"
                  className="bg-white text-indigo-600 px-8 py-3.5 rounded-full font-medium hover:bg-gray-100 transition-all hover:shadow-lg whitespace-nowrap flex-shrink-0"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-gray-800/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center text-white">
                <Brain size={18} />
              </div>
              <span className="font-bold">
                <span className="text-indigo-500">Image</span>Medix
              </span>
            </div>
            
            <p className="text-sm text-gray-500">
              © 2025 ImageMedix | All rights reserved
            </p>
            
            <div className="flex items-center gap-6">
              <Link href="#" aria-label="GitHub" className="text-gray-500 hover:text-white transition-colors">
                <Github size={20} />
              </Link>
              <Link href="#" aria-label="Website" className="text-gray-500 hover:text-white transition-colors">
                <Globe size={20} />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}