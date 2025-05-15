
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { EnterChallengeButton } from '@/components/challenge/EnterChallengeButton';
import { motion } from 'framer-motion';
import { Trophy, CalendarRange, Users2, Star, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Hero Section */}
        <div className="relative h-[600px] bg-cover bg-center flex items-center" style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1524769109498-b3318b2459df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80')"
        }}>
          <div className="container mx-auto px-4 text-center text-white">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              Book Now for Your Game On!
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg mb-8 max-w-2xl mx-auto"
            >
              Discover and book the perfect sports venues for your games. Easy booking, instant confirmation.
            </motion.p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => navigate('/venues')} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                Book A Slot Now
              </Button>
              <Button onClick={() => navigate('/venues')} variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                Browse Venues
              </Button>
            </div>
            
            {/* Challenge Mode Button */}
            {user && (
              <div className="mt-6">
                <EnterChallengeButton />
              </div>
            )}
          </div>
        </div>

        {/* Featured Venues Section */}
        <section className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Venues</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Venue Card 1 */}
              <Card className="bg-gray-900 border-gray-700 overflow-hidden venue-card">
                <div className="h-48 relative">
                  <div className="absolute inset-0 bg-center bg-cover" style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1534158914592-062992fbe900?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1375&q=80')"
                  }}></div>
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">Popular</div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">Central Sports Arena</h3>
                  <p className="text-gray-400 text-sm mb-2 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    Downtown, City Center
                  </p>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1">4.8 (241 reviews)</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button onClick={() => navigate('/venues/1')} className="w-full bg-emerald-600 hover:bg-emerald-700">Book Now</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Venue Card 2 */}
              <Card className="bg-gray-900 border-gray-700 overflow-hidden venue-card">
                <div className="h-48 relative">
                  <div className="absolute inset-0 bg-center bg-cover" style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1393&q=80')"
                  }}></div>
                  <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">Riverside Court</h3>
                  <p className="text-gray-400 text-sm mb-2 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    West End, River District
                  </p>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1">4.6 (189 reviews)</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button onClick={() => navigate('/venues/2')} className="w-full bg-emerald-600 hover:bg-emerald-700">Book Now</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Venue Card 3 */}
              <Card className="bg-gray-900 border-gray-700 overflow-hidden venue-card">
                <div className="h-48 relative">
                  <div className="absolute inset-0 bg-center bg-cover" style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1505666287802-931dc83a5dc9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1476&q=80')"
                  }}></div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">Eastside Sports Complex</h3>
                  <p className="text-gray-400 text-sm mb-2 flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                    East End, Parkside
                  </p>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1">4.4 (156 reviews)</span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button onClick={() => navigate('/venues/3')} className="w-full bg-emerald-600 hover:bg-emerald-700">Book Now</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="text-center mt-8">
              <Button onClick={() => navigate('/venues')} className="bg-emerald-600 hover:bg-emerald-700">View All Venues</Button>
            </div>
          </div>
        </section>

        {/* Popular Sports Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Popular Sports</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Sport Card 1 */}
              <div className="bg-gray-800 rounded-lg p-6 text-center hover:shadow-lg hover:bg-gray-700 transition-shadow duration-300">
                <div className="bg-emerald-900 inline-block p-3 rounded-full mx-auto mb-4">
                  <img src="https://img.icons8.com/ios/50/2E8B57/soccer-ball.png" alt="Soccer" className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-lg">Football</h3>
                <p className="text-gray-400 text-sm mt-2">62 Venues</p>
              </div>

              {/* Sport Card 2 */}
              <div className="bg-gray-800 rounded-lg p-6 text-center hover:shadow-lg hover:bg-gray-700 transition-shadow duration-300">
                <div className="bg-emerald-900 inline-block p-3 rounded-full mx-auto mb-4">
                  <img src="https://img.icons8.com/ios/50/2E8B57/basketball.png" alt="Basketball" className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-lg">Basketball</h3>
                <p className="text-gray-400 text-sm mt-2">48 Venues</p>
              </div>

              {/* Sport Card 3 */}
              <div className="bg-gray-800 rounded-lg p-6 text-center hover:shadow-lg hover:bg-gray-700 transition-shadow duration-300">
                <div className="bg-emerald-900 inline-block p-3 rounded-full mx-auto mb-4">
                  <img src="https://img.icons8.com/ios/50/2E8B57/tennis.png" alt="Tennis" className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-lg">Tennis</h3>
                <p className="text-gray-400 text-sm mt-2">35 Venues</p>
              </div>

              {/* Sport Card 4 */}
              <div className="bg-gray-800 rounded-lg p-6 text-center hover:shadow-lg hover:bg-gray-700 transition-shadow duration-300">
                <div className="bg-emerald-900 inline-block p-3 rounded-full mx-auto mb-4">
                  <img src="https://img.icons8.com/ios/50/2E8B57/swimming.png" alt="Swimming" className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-lg">Swimming</h3>
                <p className="text-gray-400 text-sm mt-2">21 Venues</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <Button onClick={() => navigate('/sports')} variant="outline" className="border-emerald-600 text-emerald-500 hover:bg-emerald-900">Explore All Sports</Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Book With Us?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gray-900 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-md mb-4">
                  <CalendarRange className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Easy Scheduling</h3>
                <p className="text-gray-300">Book your preferred time slots with just a few clicks. Real-time availability updates.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-900 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-md mb-4">
                  <Users2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Team Management</h3>
                <p className="text-gray-300">Create teams, invite friends, and organize matches together seamlessly.</p>
              </div>
              
              <div className="text-center">
                <div className="bg-gray-900 w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-md mb-4">
                  <Trophy className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Competitions</h3>
                <p className="text-gray-300">Join tournaments and leagues to compete with other teams in your area.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Athletes Section */}
        <section className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">For Athletes of All Levels</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <img src="https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" 
                  alt="Athletes playing sports" 
                  className="rounded-lg shadow-lg w-full h-auto" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-emerald-500">Find Your Perfect Match</h3>
                <p className="text-gray-300">Whether you're a casual player looking for a friendly game or a competitive athlete preparing for tournaments, we have the venues and opportunities for you.</p>
                
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="bg-emerald-900 p-1 rounded-full mr-3 mt-1">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Book individual sessions or recurring slots</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-900 p-1 rounded-full mr-3 mt-1">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Connect with other players in your area</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-900 p-1 rounded-full mr-3 mt-1">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Access to equipment rental at selected venues</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-emerald-900 p-1 rounded-full mr-3 mt-1">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Join Challenge Mode to compete and earn rewards</span>
                  </li>
                </ul>
                
                <Button onClick={() => navigate('/register')} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  Sign Up Now
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Tournament CTA Section */}
        <section className="py-16 bg-emerald-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Want To Register For A Tournament?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">Join thousands of athletes who are already using our platform to find and register for tournaments.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => navigate('/venues')} size="lg" className="bg-white text-emerald-800 hover:bg-gray-100">
                Browse Tournaments
              </Button>
              {!user && (
                <Button onClick={() => navigate('/register')} size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Create Account
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Index;
