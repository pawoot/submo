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
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    },
    {
      name: "Pro",
      price: "99",
      period: "ต่อเดือน",
      features: [
        "ทุกอย่างในแพลน ฟรี",
        "แจ้งเตือนล่วงหน้าแบบกำหนดเอง",
        "รายงานวิเคราะห์ขั้นสูง",
        "แชร์กับครอบครัวได้ 5 คน",
        "สนับสนุนลำดับความสำคัญ",
        "ส่งออกข้อมูล Excel/PDF"
      ],
      cta: "เริ่มทดลองใช้ฟรี 14 วัน",
      popular: true
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
        <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
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
              <div className="flex items-center space-x-4">
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
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 px-4 sm:px-6 lg:px-8">
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
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm">ใช้งานฟรี ไม่ต้องผูกบัตรเครดิต</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                จัดการ <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Subscription</span> ทั้งหมด<br />
                ในที่เดียว
              </h1>
              
              <p className="text-xl sm:text-2xl text-blue-200 mb-12 max-w-3xl mx-auto leading-relaxed">
                ติดตามค่าใช้จ่าย แจ้งเตือนก่อนต่ออายุ และประหยัดเงินได้จริง<br />
                ด้วย AI ที่ช่วยวิเคราะห์รูปแบบการใช้จ่ายของคุณ
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
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
              <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    10K+
                  </div>
                  <div className="text-blue-200">ผู้ใช้งาน</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    50K+
                  </div>
                  <div className="text-blue-200">Subscription</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    ฿2M+
                  </div>
                  <div className="text-blue-200">ประหยัดได้</div>
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
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                เลือกแพลนที่<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">เหมาะกับคุณ</span>
              </h2>
              <p className="text-xl text-blue-200">เริ่มต้นฟรี ไม่ต้องผูกบัตรเครดิต</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative overflow-hidden ${plan.popular ? 'bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-purple-500/50' : 'bg-white/5 border-white/10'} backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
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
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black/20 to-transparent">
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
            <div className="grid md:grid-cols-4 gap-8 mb-8">
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
                <h3 className="font-bold mb-4">บริษัท</h3>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">เกี่ยวกับเรา</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ติดต่อเรา</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">กฎหมาย</h3>
                <ul className="space-y-2 text-blue-200 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ข้อกำหนดการใช้งาน</a></li>
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