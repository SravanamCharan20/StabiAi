/* eslint-disable no-unused-vars */
import React from 'react'
import { Link } from 'react-router-dom'
import { RiRobot2Line, RiBrainLine, RiBarChartBoxLine } from 'react-icons/ri'
import { HiArrowRight, HiOutlineChartBar, HiOutlineUserGroup, HiOutlineAcademicCap } from 'react-icons/hi'

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="group cursor-pointer">
    <div className="h-40 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gray-100 transition-colors duration-300">
      <Icon className="text-4xl text-gray-900" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{description}</p>
  </div>
)

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <h1 className="text-[64px] leading-tight font-semibold text-gray-900 tracking-tight mb-6">
              AI predictions that just work.
            </h1>
            <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
              Experience the power of advanced machine learning, designed to transform your decision-making process.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                Get started
                <HiArrowRight className="text-lg" />
              </Link>
              <a
                href="#features"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: RiBrainLine, value: '99%', label: 'Prediction Accuracy' },
              { icon: RiBarChartBoxLine, value: '10M+', label: 'Predictions Made' },
              { icon: HiOutlineChartBar, value: '50K+', label: 'Active Users' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-4">
                  <stat.icon className="text-4xl text-gray-900 mx-auto" />
                </div>
                <div className="text-5xl font-semibold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-semibold text-gray-900 text-center mb-16">
            Three powerful solutions.<br />
            One intelligent platform.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <FeatureCard
              icon={HiOutlineUserGroup}
              title="Employee Analytics"
              description="Predict performance trends and identify opportunities for growth with our advanced employee analysis tools."
            />
            <FeatureCard
              icon={HiOutlineAcademicCap}
              title="Student Success"
              description="Track and forecast academic performance with precision, enabling proactive support and guidance."
            />
            <FeatureCard
              icon={HiOutlineChartBar}
              title="Investment Insights"
              description="Make informed investment decisions with AI-powered market analysis and risk assessment."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-semibold mb-6">
              Ready to transform your decision making?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join the thousands of professionals already using our AI predictions for better outcomes.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Try it free
              <HiArrowRight className="text-lg" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home