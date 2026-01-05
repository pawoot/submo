import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bell, 
  BarChart3, 
  Shield, 
  Smartphone, 
  TrendingDown, 
  Users,
  Check,
  Star,
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside or on a link
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <Bell className="h-6 w-6" />,
      title: "แจ้งเตือนอัตโนมัติ",
      description: "ไม่พลาดการต่ออายุ ด้วยระบบแจ้งเตือนล่วงหน้า"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "วิเคราะห์ค่าใช้จ่าย",
      description: "ดูภาพรวมค่าใช้จ่ายรายเดือนและรายปี"
    },
    {
      icon: <TrendingDown className="h-6 w-6" />,
      title: "ประหยัดค่าใช้จ่าย",
      description: "ค้นหาบริการที่ไม่ได้ใช้และยกเลิกได้ง่าย"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "ปลอดภัยสูงสุด",
      description: "เข้ารหัสข้อมูลทุกชั้นด้วย Supabase"
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: "ใช้งานง่าย",
      description: "UI สวยงาม ใช้งานสะดวกทุกอุปกรณ์"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "แชร์กับครอบครัว",
      description: "จัดการ Subscription ร่วมกันได้"
    }
  ];

  const plans = [
    {
      name: "ฟรี",
      price: "0",
      period: "ตลอดไป",
      features: [
        "จัดการ Subscription ไม่จำกัด",
        "แจ้งเตือนล่วงหน้า 3 วัน",
        "วิเคราะห์ค่าใช้จ่ายพื้นฐาน",
        "รองรับหลายสกุลเงิน"
      ],
      cta: "เริ่มใช้งานฟรี",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "สมชาย ใจดี",
      role: "Freelancer",
      content: "ช่วยให้ผมประหยัดเงินได้เดือนละ 1,000+ บาท จากการยกเลิก Subscription ที่ไม่ได้ใช้",
      rating: 5
    },
    {
      name: "อารยา เก่งมาก",
      role: "Digital Marketer",
      content: "UI สวยงาม ใช้งานง่าย ไม่ต้องคอยจำวันต่ออายุอีกต่อไป",
      rating: 5
    },
    {
      name: "ธนพล รวยจริง",
      role: "Content Creator",
      content: "แอพที่ทุกคนต้องมี! จัดการ Subscription หลายตัวได้ง่ายมาก",
      rating: 5
    }
  ];

  return (
    <>
      <SEO
        title="Submo.ai - จัดการ Subscription อัจฉริยะ"
        description="แอพจัดการ Subscription ที่ดีที่สุด ช่วยติดตามค่าใช้จ่าย แจ้งเตือนก่อนต่ออายุ และประหยัดเงินได้จริง"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-900 text-white">
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5 fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                  S
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Submo.ai
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-white hover:text-blue-300 transition-colors">
                  ฟีเจอร์
                </a>
                <a href="#pricing" className="text-white hover:text-blue-300 transition-colors">
                  ราคา
                </a>
                <a href="#testimonials" className="text-white hover:text-blue-300 transition-colors">
                  รีวิว
                </a>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                    เริ่มใช้งานฟรี
                  </Button>
                </Link>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMobileMenu}
            />
          )}

          {/* Mobile Menu */}
          <div
            className={`fixed top-16 right-0 bottom-0 w-64 bg-gradient-to-br from-blue-950 via-purple-950 to-blue-900 border-l border-white/10 z-50 md:hidden transform transition-transform duration-300 ${
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col p-6 space-y-6">
              <a
                href="#features"
                onClick={closeMobileMenu}
                className="text-white hover:text-blue-300 transition-colors text-lg font-medium"
              >
                ฟีเจอร์
              </a>
              <a
                href="#pricing"
                onClick={closeMobileMenu}
                className="text-white hover:text-blue-300 transition-colors text-lg font-medium"
              >
                ราคา
              </a>
              <a
                href="#testimonials"
                onClick={closeMobileMenu}
                className="text-white hover:text-blue-300 transition-colors text-lg font-medium"
              >
                รีวิว
              </a>
              <div className="border-t border-white/10 pt-6 space-y-4">
                <Link href="/auth/login" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full text-white hover:bg-white/10 justify-start">
                    เข้าสู่ระบบ
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={closeMobileMenu}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
                    เริ่มใช้งานฟรี
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          {/* Animated Background Elements with Parallax */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translateY(${scrollY * 0.5}px)`,
                transition: "transform 0.1s ease-out"
              }}
            />
            <div 
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"
              style={{
                transform: `translateY(${scrollY * 0.3}px)`,
                transition: "transform 0.1s ease-out"
              }}
            />
          </div>

          <div 
            className="max-w-7xl mx-auto relative z-10"
            style={{
              transform: `translateY(${scrollY * 0.15}px)`,
              transition: "transform 0.1s ease-out"
            }}
          >
            <div className="grid lg:grid-cols-2 gap-6 items-center">
              {/* Left Column - Text Content */}
              <div className="text-center lg:text-left lg:pr-8">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm">ใช้งานฟรี ไม่ต้องผูกบัตรเครดิต</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  คุณกำลัง <span className="text-red-500">"จ่ายทิ้ง"</span><br />
                  ปีละกี่บาท?
                </h1>
                
                <p className="text-lg sm:text-xl text-blue-200 mb-4 leading-relaxed">
                  Netflix ที่ไม่ได้ดู, Adobe ที่ลืมยกเลิก, Fitness ที่ไม่ได้ไป
                </p>
                <p className="text-lg sm:text-xl font-bold text-white mb-8">
                  <span className="text-blue-400">Submo</span> ช่วยคุณคืนค่าและหยุดรายจ่ายแผงเหล่านี้... ในคลิกเดียว
                </p>

                <div className="flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-4 mb-12">
                  <Link href="/auth/signup">
                    <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-2xl shadow-purple-500/50 group">
                      เริ่มใช้งานฟรี
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl">
                      ดูฟีเจอร์ทั้งหมด
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                      10K+
                    </div>
                    <div className="text-blue-200 text-sm">ผู้ใช้งาน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                      50K+
                    </div>
                    <div className="text-blue-200 text-sm">Subscription</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                      ฿2M+
                    </div>
                    <div className="text-blue-200 text-sm">ประหยัดได้</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Phone Mockup */}
              <div className="relative flex justify-center lg:justify-end">
                {/* Floating Animation Wrapper */}
                <div className="relative animate-float">
                  {/* Phone Frame */}
                  <div className="relative w-[320px] sm:w-[360px] h-[640px] sm:h-[720px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl border-8 border-gray-700">
                    {/* Screen */}
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] overflow-hidden relative">
                      {/* Status Bar */}
                      <div className="flex justify-between items-center px-6 pt-4 pb-3">
                        <span className="text-white text-xs">9:41</span>
                        <div className="flex space-x-1">
                          <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                          <div className="w-4 h-4 bg-white/20 rounded-full"></div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-5 py-4 h-full flex flex-col">
                        {/* Total Amount */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-5 mb-4 border border-gray-700/50">
                          <div className="text-gray-400 text-xs mb-2">ยอดรายจ่ายปีนี้ (Yearly)</div>
                          <div className="text-white text-3xl font-bold">
                            ฿ 45,900<span className="text-red-500">.00</span>
                          </div>
                        </div>

                        {/* Warning Alert */}
                        <div className="absolute top-40 right-4 bg-red-500/90 backdrop-blur-sm rounded-xl p-3 shadow-lg animate-bounce z-10 max-w-[180px]">
                          <div className="flex items-start space-x-2">
                            <Bell className="h-4 w-4 text-white flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-white text-xs font-bold">WARNING</div>
                              <div className="text-white text-xs">คุณเสียเงินล่วงไป</div>
                              <div className="text-white text-xs font-bold">แล้ว ฿5,400</div>
                            </div>
                          </div>
                        </div>

                        {/* Subscription List */}
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px]">
                          {/* Netflix */}
                          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center overflow-hidden">
                                <svg viewBox="0 0 111 30" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M105.062 14.28L111 30c-1.75-.25-3.499-.563-5.28-.845l-3.345-8.686-3.437 8.31c-1.812-.282-3.656-.563-5.5-.845l6.093-14.72L94.468 0h5.063l3.062 7.874L105.875 0h5.124l-5.937 14.28zM90.47 0h-4.594v27.25c1.5.094 3.062.156 4.594.343V0zm-8.563 26.937c-4.187-.281-8.375-.437-12.656-.437V0h4.687v21.875c2.688.062 5.375.28 7.969.405v4.657zM64.25 10.657v4.687h-6.406V26H53.22V0h13.125v4.687h-8.5v5.97h6.406zm-18.906-5.97V26.25c-1.563 0-3.156 0-4.688.062V4.687h-4.844V0h14.406v4.687h-4.874zM30.75 15.593c-2.062 0-4.5 0-6.25.095v6.968c2.75-.188 5.5-.406 8.281-.5v4.5l-12.968 1.032V0H32.78v4.687H24.5V11c1.813 0 4.594-.094 6.25-.094v4.688zM4.78 12.968v16.375C3.094 29.531 1.593 29.75 0 30V0h4.469l6.093 17.032V0h4.688v28.062c-1.656.282-3.344.376-5.125.625L4.78 12.968z" fill="#E50914"/>
                                </svg>
                              </div>
                              <div>
                                <div className="text-white font-semibold text-sm">Netflix Premium</div>
                                <div className="text-gray-400 text-xs">ติดบัตรอีก 2 วัน</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">-฿419</div>
                              <div className="text-red-400 text-xs">เกือบไม่ได้ดู</div>
                            </div>
                          </div>

                          {/* LINE */}
                          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-[#06C755] rounded-lg flex items-center justify-center overflow-hidden">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.771.039 1.086l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"></path>
                                </svg>
                              </div>
                              <div>
                                <div className="text-white font-semibold text-sm">LINE Premium</div>
                                <div className="text-gray-400 text-xs">ไม่ได้ใช้งาน 2 เดือน</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">-฿150</div>
                              <div className="text-red-400 text-xs">ยกเลิกด่วน</div>
                            </div>
                          </div>

                          {/* Spotify */}
                          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-[#1DB954] rounded-lg flex items-center justify-center overflow-hidden">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white">
                                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"></path>
                                </svg>
                              </div>
                              <div>
                                <div className="text-white font-semibold text-sm">Spotify Duo</div>
                                <div className="text-gray-400 text-xs">ใช้งานสม่ำเสมอ: เมื่อวาน</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">-฿219</div>
                              <div className="text-green-400 text-xs">ปกติ</div>
                            </div>
                          </div>

                          {/* Google One */}
                          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1.5">
                                <svg viewBox="0 0 24 24" className="w-full h-full">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                              </div>
                              <div>
                                <div className="text-white font-semibold text-sm">Google One</div>
                                <div className="text-gray-400 text-xs">ใช้งาน: 3 วันที่แล้ว</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">-฿65</div>
                              <div className="text-green-400 text-xs">ปกติ</div>
                            </div>
                          </div>
                        </div>

                        {/* Analysis Button */}
                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                          <Link href="/auth/login">
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors duration-300">
                              วิเคราะห์รายจ่ายของฉัน
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                ฟีเจอร์ที่ทำให้คุณ<br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">จัดการได้ง่ายขึ้น</span>
              </h2>
              <p className="text-xl text-blue-200">ทุกฟีเจอร์ออกแบบมาเพื่อประสบการณ์ที่ดีที่สุด</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 text-white">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                    <p className="text-blue-200 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                เลือกแพลนที่<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">เหมาะกับคุณ</span>
              </h2>
              <p className="text-xl text-blue-200">เริ่มต้นฟรี ไม่ต้องผูกบัตรเครดิต</p>
            </div>

            <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative overflow-hidden bg-white/5 border-white/10 backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-1 text-sm font-bold rounded-bl-xl">
                      ยอดนิยม
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-white">฿{plan.price}</span>
                      <span className="text-blue-200 ml-2">{plan.period}</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-100">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/signup">
                      <Button className={`w-full text-lg py-6 rounded-xl ${plan.popular ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-purple-500/50' : 'bg-white/10 hover:bg-white/20 border border-white/20'} text-white`}>
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black/20 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                ผู้ใช้งาน<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">พูดถึงเรา</span>
              </h2>
              <p className="text-xl text-blue-200">มากกว่า 10,000 คนไว้วางใจเรา</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-blue-100 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                    <div>
                      <div className="font-bold text-white">{testimonial.name}</div>
                      <div className="text-sm text-blue-300">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                พร้อมที่จะเริ่มต้น<br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ประหยัดเงิน</span>แล้วหรือยัง?
              </h2>
              <p className="text-xl text-blue-200 mb-8">
                เริ่มใช้งานฟรีวันนี้ ไม่ต้องผูกบัตรเครดิต
              </p>
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg px-12 py-6 rounded-xl shadow-2xl shadow-purple-500/50 group">
                  เริ่มใช้งานฟรี
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                    S
                  </div>
                  <span className="text-xl font-bold">Submo.ai</span>
                </div>
                <p className="text-blue-200 text-sm">จัดการ Subscription อัจฉริยะด้วย AI</p>
              </div>
              <div>
                <h3 className="font-bold mb-4">ผลิตภัณฑ์</h3>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">ราคา</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">กฎหมาย</h3>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li><Link href="/privacy-policy" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</Link></li>
                  <li><Link href="/terms-of-service" className="hover:text-white transition-colors">ข้อกำหนดการใช้งาน</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 text-center text-blue-300 text-sm">
              <p>© 2026 Submo.ai. สงวนลิขสิทธิ์.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}