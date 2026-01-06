import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="นโยบายความเป็นส่วนตัว - Submo.ai"
        description="นโยบายความเป็นส่วนตัวของ Submo.ai - เราให้ความสำคัญกับความปลอดภัยของข้อมูลส่วนบุคคลของคุณ"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-blue-900 text-white">
        {/* Navigation */}
        <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
                  S
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Submo.ai
                </span>
              </Link>

              <Link href="/">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  กลับหน้าหลัก
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            นโยบายความเป็นส่วนตัว
          </h1>

          <div className="space-y-8 text-blue-100">
            <section>
              <p className="text-lg mb-6">
                วันที่มีผลบังคับใช้: 5 มกราคม 2026
              </p>
              <p className="leading-relaxed">
                ที่ Submo.ai ("เรา", "ของเรา" หรือ "บริษัท") เราให้ความสำคัญกับความเป็นส่วนตัวของคุณอย่างยิ่ง 
                นโยบายความเป็นส่วนตัวนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณเมื่อคุณใช้บริการของเรา
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">1. ข้อมูลที่เราเก็บรวบรวม</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">1.1 ข้อมูลที่คุณให้กับเรา</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ข้อมูลการสมัครสมาชิก (ชื่อ, อีเมล, รหัสผ่าน)</li>
                    <li>ข้อมูล Subscription ของคุณ (ชื่อบริการ, ราคา, วันที่ต่ออายุ)</li>
                    <li>ข้อมูลการชำระเงิน (หากใช้บริการแบบเสียเงิน)</li>
                    <li>ข้อมูลโปรไฟล์และการตั้งค่าต่างๆ</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">1.2 ข้อมูลที่เก็บอัตโนมัติ</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>ข้อมูลการใช้งาน (วันเวลา, ฟีเจอร์ที่ใช้)</li>
                    <li>ข้อมูลอุปกรณ์ (ประเภทอุปกรณ์, ระบบปฏิบัติการ)</li>
                    <li>ข้อมูล IP address และ location โดยประมาณ</li>
                    <li>Cookies และเทคโนโลยีติดตามอื่นๆ</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">2. วิธีการใช้ข้อมูล</h2>
              <p className="mb-4">เราใช้ข้อมูลของคุณเพื่อ:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ให้บริการและดูแลบัญชีของคุณ</li>
                <li>ส่งการแจ้งเตือนเกี่ยวกับ Subscription ของคุณ</li>
                <li>ปรับปรุงและพัฒนาบริการของเรา</li>
                <li>วิเคราะห์การใช้งานเพื่อให้บริการที่ดีขึ้น</li>
                <li>ติดต่อสื่อสารเกี่ยวกับการอัพเดทและข่าวสาร</li>
                <li>ป้องกันการฉ้อโกงและรักษาความปลอดภัย</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">3. การแชร์ข้อมูล</h2>
              <p className="mb-4">เราจะไม่ขาย เช่า หรือแชร์ข้อมูลส่วนบุคคลของคุณกับบุคคลที่สาม ยกเว้น:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>เมื่อคุณให้ความยินยอม</li>
                <li>กับผู้ให้บริการที่ช่วยเราดำเนินธุรกิจ (เช่น Supabase สำหรับฐานข้อมูล)</li>
                <li>เมื่อกฎหมายกำหนดหรือเพื่อปกป้องสิทธิของเรา</li>
                <li>ในกรณีที่มีการควบรวมกิจการหรือขายบริษัท</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">4. ความปลอดภัยของข้อมูล</h2>
              <p className="leading-relaxed">
                เราใช้มาตรการรักษาความปลอดภัยตามมาตรฐานอุตสาหกรรม เพื่อปกป้องข้อมูลของคุณจากการเข้าถึง 
                การเปิดเผย หรือการใช้งานโดยไม่ได้รับอนุญาต รวมถึง:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>การเข้ารหัสข้อมูลด้วย SSL/TLS</li>
                <li>การจัดเก็บข้อมูลบน Supabase ที่มีความปลอดภัยสูง</li>
                <li>การ hash รหัสผ่านด้วยอัลกอริทึมที่แข็งแกร่ง</li>
                <li>การจำกัดการเข้าถึงข้อมูลเฉพาะผู้ที่จำเป็น</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">5. สิทธิของคุณ</h2>
              <p className="mb-4">คุณมีสิทธิ์:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>เข้าถึงและขอสำเนาข้อมูลส่วนบุคคลของคุณ</li>
                <li>แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                <li>ลบข้อมูลหรือบัญชีของคุณ</li>
                <li>คัดค้านหรือจำกัดการประมวลผลข้อมูล</li>
                <li>ถอนความยินยอมที่เคยให้ไว้</li>
                <li>โอนย้ายข้อมูลของคุณ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">6. Cookies</h2>
              <p className="leading-relaxed">
                เราใช้ Cookies และเทคโนโลยีที่คล้ายกันเพื่อปรับปรุงประสบการณ์การใช้งานของคุณ 
                คุณสามารถตั้งค่าเบราว์เซอร์ของคุณเพื่อปฏิเสธ Cookies แต่อาจส่งผลต่อการใช้งานบางฟีเจอร์
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">7. การเก็บรักษาข้อมูล</h2>
              <p className="leading-relaxed">
                เราจะเก็บรักษาข้อมูลของคุณไว้ตдо้นจำเป็นเพื่อให้บริการหรือตามที่กฎหมายกำหนด 
                เมื่อคุณลบบัญชี เราจะลบข้อมูลส่วนบุคคลของคุณภายใน 30 วัน 
                ยกเว้นข้อมูลที่เราต้องเก็บไว้ตามกฎหมาย
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">8. เด็กและผู้เยาว์</h2>
              <p className="leading-relaxed">
                บริการของเราไม่ได้มุ่งเน้นสำหรับผู้ที่อายุต่ำกว่า 18 ปี 
                เราไม่จงใจเก็บรวบรวมข้อมูลจากเด็ก หากคุณเชื่อว่าเราได้เก็บข้อมูลจากเด็กโดยไม่ได้ตั้งใจ 
                โปรดติดต่อเราทันทีเพื่อให้เราดำเนินการลบข้อมูลดังกล่าว
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">9. การเปลี่ยนแปลงนโยบาย</h2>
              <p className="leading-relaxed">
                เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงที่สำคัญจะแจ้งให้คุณทราบผ่านอีเมลหรือการแจ้งเตือนบนเว็บไซต์ 
                เราขอแนะนำให้คุณตรวจสอบนโยบายนี้เป็นประจำ
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">10. ติดต่อเรา</h2>
              <p className="leading-relaxed mb-4">
                หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้หรือต้องการใช้สิทธิของคุณ โปรดติดต่อเราที่:
              </p>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <p className="font-semibold text-white mb-2">Submo.ai</p>
                <p>อีเมล: privacy@submo.ai</p>
                <p>เว็บไซต์: https://submo.ai</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-7xl mx-auto text-center text-blue-300 text-sm">
            <p>© 2026 Submo.ai. สงวนลิขสิทธิ์.</p>
          </div>
        </footer>
      </div>
    </>
  );
}