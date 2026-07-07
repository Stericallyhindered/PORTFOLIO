import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Search, 
  Video, 
  Trophy, 
  Users, 
  Target, 
  Star, 
  Gift,
  ArrowRight,
  CheckCircle,
  Play,
  Award,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'Learn how Bass Clown Co. connects creators with brands through contests, giveaways, and video content creation. Simple steps to start earning and creating.',
  keywords: 'how it works, creator platform, brand contests, video creation, giveaways, points system',
  alternates: {
    canonical: 'https://bassclown.com/how-it-works',
  },
};

const creatorSteps = [
  {
    step: 1,
    title: 'Sign Up & Create Profile',
    description: 'Join our community of creators and showcase your skills with a personalized profile.',
    icon: UserPlus,
    details: [
      'Create your free account in minutes',
      'Upload your best work samples',
      'Set your interests and specialties',
      'Complete your creator profile',
    ],
  },
  {
    step: 2,
    title: 'Browse & Apply to Contests',
    description: 'Discover exciting contests from top brands and apply with your creative ideas.',
    icon: Search,
    details: [
      'Browse contests by category and brand',
      'Read contest briefs and requirements',
      'Submit your application with concept',
      'Get selected for paid opportunities',
    ],
  },
  {
    step: 3,
    title: 'Create & Submit Content',
    description: 'Bring your creative vision to life and submit your best work.',
    icon: Video,
    details: [
      'Create content following brand guidelines',
      'Upload videos up to 1GB in HD quality',
      'Add descriptions and tags',
      'Submit before the deadline',
    ],
  },
  {
    step: 4,
    title: 'Get Judged & Win',
    description: 'Professional judges evaluate your work and winners receive prizes and recognition.',
    icon: Trophy,
    details: [
      'Submissions judged on creativity and quality',
      'Detailed feedback from industry experts',
      'Winners announced publicly',
      'Prizes and points awarded instantly',
    ],
  },
];

const brandSteps = [
  {
    step: 1,
    title: 'Create Brand Account',
    description: 'Set up your brand profile and showcase your company to our creator community.',
    icon: Target,
    details: [
      'Register your brand account',
      'Upload brand assets and guidelines',
      'Set your brand story and values',
      'Define your target audience',
    ],
  },
  {
    step: 2,
    title: 'Launch Contests',
    description: 'Create engaging contests that attract the right creators for your brand.',
    icon: Star,
    details: [
      'Define contest goals and requirements',
      'Set prizes and participation rewards',
      'Choose judging criteria and timeline',
      'Publish to our creator network',
    ],
  },
  {
    step: 3,
    title: 'Review Submissions',
    description: 'Use our advanced judging tools to evaluate and score creator submissions.',
    icon: CheckCircle,
    details: [
      'Access comprehensive judging dashboard',
      'Score submissions on multiple criteria',
      'Leave detailed feedback for creators',
      'Collaborate with team members',
    ],
  },
  {
    step: 4,
    title: 'Select Winners & Amplify',
    description: 'Choose winners and leverage winning content for your marketing campaigns.',
    icon: Award,
    details: [
      'Select winners based on scores and criteria',
      'Automatic winner notifications and payments',
      'Download content for marketing use',
      'Access usage rights and licensing',
    ],
  },
];

const platformFeatures = [
  {
    title: 'Points System',
    description: 'Earn points through participation and use them to enter premium contests.',
    icon: Zap,
    benefits: [
      'Monthly point allowances with subscriptions',
      'Earn bonus points for quality submissions',
      'Purchase additional points as needed',
      'Redeem points for exclusive opportunities',
    ],
  },
  {
    title: 'Giveaways',
    description: 'Participate in exciting giveaways for chances to win amazing prizes.',
    icon: Gift,
    benefits: [
      'Regular giveaways from partner brands',
      'Simple entry process with points',
      'Fair and transparent drawing system',
      'Instant winner notifications',
    ],
  },
  {
    title: 'Community',
    description: 'Connect with fellow creators and brands in our vibrant community.',
    icon: Users,
    benefits: [
      'Network with other creators',
      'Share tips and best practices',
      'Get feedback on your work',
      'Collaborate on projects',
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              How Bass Clown Co. Works
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Connecting creators with brands through contests, giveaways, and video content creation. 
              Simple steps to start earning and creating.
            </p>
          </div>
        </div>
      </div>

      {/* Creator Journey */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge className="bg-blue-100 text-blue-800 px-4 py-2 mb-4">
            For Creators
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900">Your Creator Journey</h2>
          <p className="mt-4 text-xl text-gray-600">
            Four simple steps to start creating and earning with top brands
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {creatorSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <div className="p-3 rounded-full bg-blue-100">
                          <Icon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          {step.step}
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold">{step.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                {index < creatorSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/register">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Creating Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Brand Journey */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <Badge className="bg-purple-100 text-purple-800 px-4 py-2 mb-4">
              For Brands
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900">Your Brand Journey</h2>
            <p className="mt-4 text-xl text-gray-600">
              Four simple steps to launch contests and connect with talented creators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {brandSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <div className="p-3 rounded-full bg-purple-100">
                            <Icon className="h-8 w-8 text-purple-600" />
                          </div>
                          <div className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                            {step.step}
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-lg font-bold">{step.title}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {step.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {index < brandSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/contact">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                Launch Your Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Platform Features */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Platform Features</h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to succeed on our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-green-100">
                        <Icon className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of creators and brands who are already creating amazing content together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Play className="mr-2 h-5 w-5" />
                  Start Creating
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Users className="mr-2 h-5 w-5" />
                  Launch Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 