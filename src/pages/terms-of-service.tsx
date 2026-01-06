import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <>
      <SEO
        title="ข้อกำหนดการใช้งาน - Submo.ai"
        description="ข้อกำหนดและเงื่อนไขการใช้บริการของ Submo.ai"
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
            ข้อกำหนดการใช้งาน
          </h1>

          <div className="space-y-8 text-blue-100">
            <section>
              <p className="text-lg mb-6">
                วันที่มีผลบังคับใช้: 5 มกราคม 2026
              </p>
              <p className="leading-relaxed">
                ยินดีต้อนรับสู่ Submo.ai โปรดอ่านข้อกำหนดการใช้งานนี้อย่างละเอียดก่อนใช้บริการของเรา 
                การเข้าถึงหรือใช้บริการของเราถือว่าคุณยอมรับและตกลงที่จะปฏิบัติตามข้อกำหนดเหล่านี้
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">1. การยอมรับข้อกำหนด</h2>
              <p className="leading-relaxed">
                เมื่อคุณเข้าถึงหรือใช้บริการ Submo.ai ("บริการ", "แพลตฟอร์ม") คุณตกลงที่จะผูกพันตามข้อกำหนดการใช้งานนี้ 
                นโยบายความเป็นส่วนตัว และแนวทางอื่นๆ ที่เรากำหนด หากคุณไม่เห็นด้วยกับข้อกำหนดเหล่านี้ 
                โปรดอย่าใช้บริการของเรา
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">2. คำอธิบายบริการ</h2>
              <p className="leading-relaxed mb-4">
                Submo.ai เป็นแพลตฟอร์มจัดการ Subscription ที่ช่วยให้คุณ:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ติดตามและจัดการ Subscription ต่างๆ ของคุณ</li>
                <li>รับการแจ้งเตือนก่อนวันต่ออายุ</li>
                <li>วิเคราะห์ค่าใช้จ่ายและรับคำแนะนำเพื่อประหยัดเงิน</li>
                <li>จัดการข้อมูล Subscription แบบมีความปลอดภัยสูง</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">3. การสมัครสมาชิกและบัญชี</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">3.1 การสร้างบัญชี</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>คุณต้องมีอายุอย่างน้อย 18 ปีเพื่อใช้บริการ</li>
                    <li>ข้อมูลที่คุณให้ต้องถูกต้อง ครบถ้วน และเป็นปัจจุบัน</li>
                    <li>คุณต้องรักษาความลับของรหัสผ่านและรับผิดชอบต่อกิจกรรมในบัญชีของคุณ</li>
                    <li>แจ้งเราทันทีหากมีการใช้งานบัญชีโดยไม่ได้รับอนุญาต</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">3.2 การระงับและยกเลิกบัญชี</h3>
                  <p className="leading-relaxed">
                    เราขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีของคุณหากคุณละเมิดข้อกำหนดนี้ 
                    คุณสามารถลบบัญชีของคุณได้ตลอดเวลาผ่านการตั้งค่าบัญชี
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">4. แพลนและการชำระเงิน</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">4.1 แพลนฟรี</h3>
                  <p className="leading-relaxed">
                    เราเสนอแพลนฟรีที่ให้คุณเข้าถึงฟีเจอร์พื้นฐานของบริการได้ตลอดเวลา 
                    แพลนฟรีอาจมีข้อจำกัดบางประการเกี่ยวกับฟีเจอร์หรือการใช้งาน
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-white">4.2 แพลนเสียเงิน (ในอนาคต)</h3>
                  <p className="leading-relaxed">
                    เราอาจเสนอแพลนเสียเงินในอนาคต ซึ่งจะมีรายละเอียดเกี่ยวกับราคา การชำระเงิน 
                    และการยกเลิกที่ชัดเจน คุณจะได้รับแจ้งล่วงหน้าก่อนที่แพลนเหล่านี้จะเปิดให้บริการ
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">5. การใช้งานที่ยอมรับได้</h2>
              <p className="mb-4">คุณตกลงที่จะไม่:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือไม่ได้รับอนุญาต</li>
                <li>ละเมิดสิทธิ์ทางทรัพย์สินทางปัญญาของเราหรือบุคคลอื่น</li>
                <li>อัพโหลดหรือส่งข้อมูลที่เป็นอันตราย มัลแวร์ หรือไวรัส</li>
                <li>พยายามเข้าถึงระบบหรือข้อมูลของผู้อื่นโดยไม่ได้รับอนุญาต</li>
                <li>ใช้บริการในลักษณะที่อาจทำให้เกิดความเสียหายหรือรบกวนการทำงาน</li>
                <li>แชร์บัญชีของคุณกับบุคคลอื่น</li>
                <li>ใช้บอทหรือระบบอัตโนมัติเพื่อเข้าถึงบริการ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">6. เนื้อหาของผู้ใช้</h2>
              <div className="space-y-4">
                <p className="leading-relaxed">
                  คุณยังคงเป็นเจ้าของข้อมูล Subscription และเนื้อหาอื่นๆ ที่คุณอัพโหลดหรือสร้างในบริการ 
                  ("เนื้อหาของผู้ใช้") โดยการใช้บริการ คุณอนุญาตให้เราใช้เนื้อหาของผู้ใช้เพื่อ:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>ให้บริการและดำเนินการตามที่คุณร้องขอ</li>
                  <li>ปรับปรุงและพัฒนาบริการของเรา</li>
                  <li>สร้างข้อมูลรวมที่ไม่สามารถระบุตัวบุคคลได้</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">7. ทรัพย์สินทางปัญญา</h2>
              <p className="leading-relaxed">
                บริการ Submo.ai รวมถึงเนื้อหา ฟีเจอร์ และฟังก์ชันการทำงาน เป็นทรัพย์สินของ Submo.ai 
                และได้รับการคุ้มครองโดยกฎหมายลิขสิทธิ์ เครื่องหมายการค้า และกฎหมายอื่นๆ 
                คุณไม่สามารถคัดลอก แจกจ่าย แก้ไข หรือใช้งานในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">8. การจำกัดความรับผิด</h2>
              <p className="leading-relaxed mb-4">
                บริการจัดให้ "ตามสภาพ" และ "ตามที่มี" เราไม่รับประกันว่าบริการจะไม่มีข้อผิดพลาด 
                ปลอดภัย หรือพร้อมใช้งานตลอดเวลา ในขอบเขตสูงสุดที่กฎหมายอนุญาต เราไม่รับผิดชอบต่อ:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>ความเสียหายทางอ้อม โดยบังเอิญ หรือเป็นผลสืบเนื่อง</li>
                <li>การสูญเสียข้อมูล กำไร หรือรายได้</li>
                <li>การหยุดชะงักของธุรกิจหรือการใช้งาน</li>
                <li>ความเสียหายที่เกิดจากการกระทำของบุคคลที่สาม</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">9. การชดเชย</h2>
              <p className="leading-relaxed">
                คุณตกลงที่จะชดใช้ ป้องกัน และไม่ทำให้ Submo.ai พนักงาน และผู้ให้บริการของเราได้รับความเสียหาย 
                จากการเรียกร้อง ค่าใช้จ่าย หรือความเสียหายใดๆ ที่เกิดจากการละเมิดข้อกำหนดนี้หรือการใช้บริการของคุณ
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">10. การเปลี่ยนแปลงบริการและข้อกำหนด</h2>
              <p className="leading-relaxed">
                เราขอสงวนสิทธิ์ในการแก้ไข ระงับ หรือยกเลิกบริการหรือฟีเจอร์ใดๆ ได้ตลอดเวลา 
                เราอาจปรับปรุงข้อกำหนดนี้เป็นครั้งคราว การเปลี่ยนแปลงที่สำคัญจะแจ้งให้คุณทราบผ่านอีเมลหรือการแจ้งเตือนบนแพลตฟอร์ม 
                การใช้บริการต่อไปหลังจากการเปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดใหม่
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">11. กฎหมายที่ใช้บังคับ</h2>
              <p className="leading-relaxed">
                ข้อกำหนดนี้อยู่ภายใต้และตีความตามกฎหมายของประเทศไทย 
                ข้อพิพาทใดๆ ที่เกิดขึ้นจากหรือเกี่ยวกับข้อกำหนดนี้จะอยู่ภายใต้เขตอำนาจศาลของประเทศไทย
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">12. การติดต่อ</h2>
              <p className="leading-relaxed mb-4">
                หากคุณมีคำถามเกี่ยวกับข้อกำหนดการใช้งานนี้ โปรดติดต่อเราที่:
              </p>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <p className="font-semibold text-white mb-2">Submo.ai</p>
                <p>อีเมล: support@submo.ai</p>
                <p>เว็บไซต์: https://submo.ai</p>
              </div>
            </section>

            <section className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <p className="text-white font-semibold mb-2">
                การใช้บริการของเราหมายความว่าคุณได้อ่านและยอมรับข้อกำหนดการใช้งานนี้แล้ว
              </p>
              <p className="text-sm">
                ขอบคุณที่ใช้ Submo.ai!
              </p>
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