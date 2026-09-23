"""
Seed or update the database with comprehensive Thai fundamental Python problems.
Safe and idempotent: updates existing problems if slug matches, or adds new ones with complete test cases.
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.core.database import SessionLocal
from app.models.course import Course, Difficulty
from app.models.problem import Problem
from app.models.test_case import TestCase
from app.core.app_logging import logger


def seed_thai_problems(db=None):
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    try:
        logger.info("Seeding / Updating Thai fundamental Python problems...")

        # 1. Ensure courses exist
        courses = {
            1: db.query(Course).filter(Course.slug == "python-fundamentals").first(),
            2: db.query(Course).filter(Course.slug == "control-flow-and-logic").first(),
            3: db.query(Course).filter(Course.slug == "data-structures-in-python").first(),
        }

        # Update course titles and descriptions in Thai
        if courses[1]:
            courses[1].title = "พื้นฐานภาษา Python (Python Fundamentals)"
            courses[1].description = "ปูพื้นฐานไวยากรณ์ การใช้งานตัวแปร ตัวดำเนินการคณิตศาสตร์ การรับค่าทางคีย์บอร์ด (input) และการแสดงผลลัพธ์ (output)"
        if courses[2]:
            courses[2].title = "การควบคุมทิศทางการทำงานและตรรกศาสตร์ (Control Flow & Logic)"
            courses[2].description = "เรียนรู้การตัดสินใจด้วยคำสั่ง if-else, ตรรกศาสตร์แบบบูลีน, ลูป while และ for เพื่อแก้ปัญหาอย่างเป็นระบบ"
        if courses[3]:
            courses[3].title = "โครงสร้างข้อมูลใน Python (Data Structures in Python)"
            courses[3].description = "ฝึกใช้งาน List, String, Dictionary, Set และ Tuple พร้อมเทคนิคการจัดเรียงและการประมวลผลข้อมูล"

        db.commit()

        # Helper function to upsert problem & test cases
        def upsert_problem(course_slug: str, prob_data: dict, test_cases_data: list):
            course = db.query(Course).filter(Course.slug == course_slug).first()
            if not course:
                logger.warning(f"Course {course_slug} not found!")
                return

            prob = db.query(Problem).filter(Problem.slug == prob_data["slug"]).first()
            if not prob:
                prob = Problem(course_id=course.id, **prob_data)
                db.add(prob)
                db.flush()
                logger.info(f"Created new problem: {prob.title}")
            else:
                for k, v in prob_data.items():
                    setattr(prob, k, v)
                db.flush()
                logger.info(f"Updated existing problem: {prob.title}")

            # Delete old test cases and recreate cleanly
            db.query(TestCase).filter(TestCase.problem_id == prob.id).delete()
            db.flush()

            for tc in test_cases_data:
                test_case = TestCase(
                    problem_id=prob.id,
                    input_data=tc["input_data"],
                    expected_output=tc["expected_output"],
                    is_hidden=tc.get("is_hidden", True),
                    points=tc.get("points", 5),
                )
                db.add(test_case)

            db.commit()

        # ----------------------------------------------------
        # COURSE 1: Python Fundamentals
        # ----------------------------------------------------

        # Problem 1: คำนวณผลรวมสองจำนวน
        upsert_problem(
            "python-fundamentals",
            {
                "title": "คำนวณผลรวมสองจำนวน (Calculate Sum)",
                "slug": "calculate-sum",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม 2 จำนวนจากผู้ใช้ (ในบรรทัดเดียวกัน คั่นด้วยช่องว่าง) แล้วพิมพ์ผลรวมของตัวเลขทั้งสองออกมาทางหน้าจอ",
                "input_description": "จำนวนเต็ม A และ B คั่นด้วยช่องว่าง 1 บรรทัด เช่น: 5 7",
                "output_description": "พิมพ์ผลรวมของ A + B เป็นจำนวนเต็ม",
                "constraints_text": "-10^9 <= A, B <= 10^9",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "5 7", "expected_output": "12", "is_hidden": False, "points": 5},
                {"input_data": "100 250", "expected_output": "350", "is_hidden": False, "points": 5},
                {"input_data": "-10 25", "expected_output": "15", "is_hidden": True, "points": 5},
                {"input_data": "0 0", "expected_output": "0", "is_hidden": True, "points": 5},
                {"input_data": "-50 -70", "expected_output": "-120", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 2: กลับลำดับข้อความ
        upsert_problem(
            "python-fundamentals",
            {
                "title": "กลับลำดับข้อความ (Reverse a String)",
                "slug": "reverse-a-string",
                "description": "เขียนโปรแกรมรับข้อความสตริง 1 บรรทัดจากผู้ใช้ แล้วแสดงข้อความเดิมแต่กลับตัวอักษรจากหลังมาหน้า",
                "input_description": "ข้อความ 1 บรรทัด เช่น: python",
                "output_description": "ข้อความที่กลับลำดับแล้ว เช่น: nohtyp",
                "constraints_text": "1 <= ความยาวสตริง <= 1000",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "python", "expected_output": "nohtyp", "is_hidden": False, "points": 5},
                {"input_data": "Hello World", "expected_output": "dlroW olleH", "is_hidden": False, "points": 5},
                {"input_data": "racecar", "expected_output": "racecar", "is_hidden": True, "points": 5},
                {"input_data": "123456789", "expected_output": "987654321", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 3: คำนวณดัชนีมวลกาย BMI
        upsert_problem(
            "python-fundamentals",
            {
                "title": "คำนวณดัชนีมวลกาย (BMI Calculator)",
                "slug": "bmi-calculator",
                "description": "เขียนโปรแกรมรับค่าน้ำหนัก (กิโลกรัม) และส่วนสูง (เซนติเมตร) โดยแยกกันบรรทัดละค่า แล้วคำนวณค่าดัชนีมวลกาย (BMI) ตามสูตร:\n\nBMI = น้ำหนัก / ((ส่วนสูง / 100) ** 2)\n\nแล้วแสดงผลลัพธ์เป็นตัวเลขทศนิยม 2 ตำแหน่ง",
                "input_description": "บรรทัดที่ 1: น้ำหนัก (กิโลกรัม) เป็นตัวเลขทศนิยมหรือจำนวนเต็ม\nบรรทัดที่ 2: ส่วนสูง (เซนติเมตร) เป็นตัวเลขทศนิยมหรือจำนวนเต็ม",
                "output_description": "ค่า BMI เป็นตัวเลขทศนิยม 2 ตำแหน่ง (ตัวอย่าง: 22.86)",
                "constraints_text": "10.0 <= น้ำหนัก <= 300.0, 50.0 <= ส่วนสูง <= 250.0",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "70\n175", "expected_output": "22.86", "is_hidden": False, "points": 5},
                {"input_data": "50\n160", "expected_output": "19.53", "is_hidden": False, "points": 5},
                {"input_data": "85\n180", "expected_output": "26.23", "is_hidden": True, "points": 5},
                {"input_data": "45\n150", "expected_output": "20.00", "is_hidden": True, "points": 5},
                {"input_data": "68.5\n172.5", "expected_output": "23.02", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 4: นับจำนวนสระในภาษาอังกฤษ
        upsert_problem(
            "python-fundamentals",
            {
                "title": "นับจำนวนสระภาษาอังกฤษ (Vowel Counter)",
                "slug": "vowel-counter",
                "description": "เขียนโปรแกรมรับข้อความภาษาอังกฤษ 1 บรรทัด แล้วนับว่ามีตัวอักษรที่เป็นสระ (Vowels) ทั้งหมดกี่ตัว โดยสระในภาษาอังกฤษได้แก่ a, e, i, o, u (นับทั้งตัวพิมพ์เล็กและตัวพิมพ์ใหญ่)",
                "input_description": "ข้อความภาษาอังกฤษ 1 บรรทัด เช่น: Hello World",
                "output_description": "จำนวนสระทั้งหมดที่พบในข้อความ แสดงเป็นจำนวนเต็มตัวเดียว",
                "constraints_text": "1 <= ความยาวข้อความ <= 1000",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "Hello World", "expected_output": "3", "is_hidden": False, "points": 5},
                {"input_data": "Python Programming", "expected_output": "4", "is_hidden": False, "points": 5},
                {"input_data": "AEIOU aeiou", "expected_output": "10", "is_hidden": True, "points": 5},
                {"input_data": "rhythm fly dry", "expected_output": "0", "is_hidden": True, "points": 5},
                {"input_data": "Quick Brown Fox Jumps Over Lazy Dog", "expected_output": "9", "is_hidden": True, "points": 5},
            ],
        )

        # ----------------------------------------------------
        # COURSE 2: Control Flow & Logic
        # ----------------------------------------------------

        # Problem 5: ตรวจสอบเลขคู่หรือเลขคี่
        upsert_problem(
            "control-flow-and-logic",
            {
                "title": "ตรวจสอบเลขคู่หรือเลขคี่ (Even or Odd)",
                "slug": "even-or-odd",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม N จำนวน 1 ตัว แล้วตรวจสอบว่า N เป็นเลขคู่หรือเลขคี่\nถ้าเป็นเลขคู่ให้แสดงผลลัพธ์เป็นคำว่า 'Even' และถ้าเป็นเลขคี่ให้แสดงผลลัพธ์เป็นคำว่า 'Odd'",
                "input_description": "จำนวนเต็ม N จำนวน 1 ตัว เช่น: 4",
                "output_description": "คำว่า 'Even' หรือ 'Odd'",
                "constraints_text": "-10^6 <= N <= 10^6",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "4", "expected_output": "Even", "is_hidden": False, "points": 5},
                {"input_data": "7", "expected_output": "Odd", "is_hidden": False, "points": 5},
                {"input_data": "0", "expected_output": "Even", "is_hidden": True, "points": 5},
                {"input_data": "-9", "expected_output": "Odd", "is_hidden": True, "points": 5},
                {"input_data": "-100", "expected_output": "Even", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 6: ระบบตัดเกรดผลการเรียน
        upsert_problem(
            "control-flow-and-logic",
            {
                "title": "ระบบตัดเกรดผลการเรียน (Grade Calculator)",
                "slug": "grade-calculator",
                "description": "เขียนโปรแกรมรับคะแนนสอบของนักเรียน (จำนวนเต็ม 0 ถึง 100) แล้วตัดเกรดตามเกณฑ์ดังนี้:\n- 80 คะแนนขึ้นไป: A\n- 70 ถึง 79 คะแนน: B\n- 60 ถึง 69 คะแนน: C\n- 50 ถึง 59 คะแนน: D\n- ต่ำกว่า 50 คะแนน: F",
                "input_description": "จำนวนเต็มคะแนนสอบ S (0 <= S <= 100)",
                "output_description": "ตัวอักษรเกรด A, B, C, D หรือ F",
                "constraints_text": "0 <= S <= 100",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "85", "expected_output": "A", "is_hidden": False, "points": 5},
                {"input_data": "62", "expected_output": "C", "is_hidden": False, "points": 5},
                {"input_data": "80", "expected_output": "A", "is_hidden": True, "points": 5},
                {"input_data": "79", "expected_output": "B", "is_hidden": True, "points": 5},
                {"input_data": "50", "expected_output": "D", "is_hidden": True, "points": 5},
                {"input_data": "49", "expected_output": "F", "is_hidden": True, "points": 5},
                {"input_data": "0", "expected_output": "F", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 7: สูตรคูณแม่ N
        upsert_problem(
            "control-flow-and-logic",
            {
                "title": "สูตรคูณแม่ N (Multiplication Table)",
                "slug": "multiplication-table",
                "description": "เขียนโปรแกรมรับจำนวนเต็มบวก N แล้วแสดงสูตรคูณแม่ N ตั้งแต่คูณ 1 จนถึงคูณ 12 แต่ละบรรทัดในรูปแบบ:\n\nN x i = Result\n\n(เว้นวรรคระหว่างเครื่องหมาย x และ = ตามตัวอย่าง)",
                "input_description": "จำนวนเต็มบวก N จำนวน 1 ตัว เช่น: 2",
                "output_description": "สูตรคูณ 12 บรรทัด ตั้งแต่ N x 1 จนถึง N x 12",
                "constraints_text": "1 <= N <= 100",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {
                    "input_data": "2",
                    "expected_output": "2 x 1 = 2\n2 x 2 = 4\n2 x 3 = 6\n2 x 4 = 8\n2 x 5 = 10\n2 x 6 = 12\n2 x 7 = 14\n2 x 8 = 16\n2 x 9 = 18\n2 x 10 = 20\n2 x 11 = 22\n2 x 12 = 24",
                    "is_hidden": False,
                    "points": 5,
                },
                {
                    "input_data": "5",
                    "expected_output": "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50\n5 x 11 = 55\n5 x 12 = 60",
                    "is_hidden": False,
                    "points": 5,
                },
                {
                    "input_data": "7",
                    "expected_output": "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70\n7 x 11 = 77\n7 x 12 = 84",
                    "is_hidden": True,
                    "points": 5,
                },
            ],
        )

        # Problem 8: ตรวจสอบปีอธิกสุรทิน
        upsert_problem(
            "control-flow-and-logic",
            {
                "title": "ตรวจสอบปีอธิกสุรทิน (Leap Year Checker)",
                "slug": "leap-year-checker",
                "description": "เขียนโปรแกรมตรวจสอบว่าปี ค.ศ. ที่รับเข้ามา เป็นปีอธิกสุรทิน (Leap Year) ที่มี 366 วันหรือไม่\n\nเงื่อนไข:\n1. ปีนั้นต้องหารด้วย 4 ลงตัว\n2. แต่ถ้าปีนั้นหารด้วย 100 ลงตัวด้วย จะต้องหารด้วย 400 ลงตัวด้วย จึงจะเป็นปีอธิกสุรทิน\n\nถ้าเป็นปีอธิกสุรทิน ให้พิมพ์ 'Leap Year' และถ้าไม่เป็น ให้พิมพ์ 'Not a Leap Year'",
                "input_description": "จำนวนเต็มปี ค.ศ. เช่น: 2024",
                "output_description": "คำว่า 'Leap Year' หรือ 'Not a Leap Year'",
                "constraints_text": "1 <= ปี ค.ศ. <= 9999",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "2024", "expected_output": "Leap Year", "is_hidden": False, "points": 5},
                {"input_data": "1900", "expected_output": "Not a Leap Year", "is_hidden": False, "points": 5},
                {"input_data": "2000", "expected_output": "Leap Year", "is_hidden": True, "points": 5},
                {"input_data": "2023", "expected_output": "Not a Leap Year", "is_hidden": True, "points": 5},
                {"input_data": "2400", "expected_output": "Leap Year", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 9: ผลรวมของเลขคู่ตั้งแต่ 1 ถึง N
        upsert_problem(
            "control-flow-and-logic",
            {
                "title": "หาผลรวมของเลขคู่ตั้งแต่ 1 ถึง N (Sum of Even Numbers)",
                "slug": "sum-of-even-numbers",
                "description": "เขียนโปรแกรมรับจำนวนเต็มบวก N แล้วหาผลรวมของตัวเลขคู่ทั้งหมดที่อยู่ระหว่าง 1 ถึง N (เช่น ถ้า N=10 ผลรวมคือ 2 + 4 + 6 + 8 + 10 = 30)",
                "input_description": "จำนวนเต็มบวก N จำนวน 1 ตัว เช่น: 10",
                "output_description": "ผลรวมของเลขคู่ตั้งแต่ 1 ถึง N",
                "constraints_text": "1 <= N <= 100,000",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "10", "expected_output": "30", "is_hidden": False, "points": 5},
                {"input_data": "5", "expected_output": "6", "is_hidden": False, "points": 5},
                {"input_data": "1", "expected_output": "0", "is_hidden": True, "points": 5},
                {"input_data": "20", "expected_output": "110", "is_hidden": True, "points": 5},
                {"input_data": "100", "expected_output": "2550", "is_hidden": True, "points": 5},
            ],
        )

        # ----------------------------------------------------
        # COURSE 3: Data Structures in Python
        # ----------------------------------------------------

        # Problem 10: หาค่าสูงสุดในชุดตัวเลข
        upsert_problem(
            "data-structures-in-python",
            {
                "title": "หาค่าสูงสุดในชุดตัวเลข (Find Maximum Value)",
                "slug": "find-the-maximum-value",
                "description": "เขียนโปรแกรมรับชุดตัวเลขจำนวนเต็มหลายจำนวนในบรรทัดเดียว (คั่นด้วยช่องว่าง) แล้วค้นหาพร้อมพิมพ์ค่าตัวเลขที่มากที่สุดในชุดข้อมูลนั้นออกมา",
                "input_description": "ตัวเลขจำนวนเต็มหลายตัวคั่นด้วยช่องว่าง เช่น: 3 7 2 9 5",
                "output_description": "ตัวเลขที่มากที่สุดจำนวนเดียว เช่น: 9",
                "constraints_text": "1 <= จำนวนตัวเลข <= 10^5, -10^9 <= แต่ละค่า <= 10^9",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 15,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "3 7 2 9 5", "expected_output": "9", "is_hidden": False, "points": 5},
                {"input_data": "-5 -1 -10 -20", "expected_output": "-1", "is_hidden": False, "points": 5},
                {"input_data": "42", "expected_output": "42", "is_hidden": True, "points": 5},
                {"input_data": "1000 500 2000 1500", "expected_output": "2000", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 11: ตัดตัวเลขที่ซ้ำและเรียงลำดับ
        upsert_problem(
            "data-structures-in-python",
            {
                "title": "ตัดข้อมูลที่ซ้ำและเรียงลำดับ (Unique & Sorted Numbers)",
                "slug": "unique-and-sorted",
                "description": "เขียนโปรแกรมรับชุดตัวเลขจำนวนเต็มหลายจำนวนในบรรทัดเดียว จากนั้นนำตัวเลขมากำจัดค่าที่ซ้ำกันออก แล้วเรียงลำดับจากน้อยไปหามาก และแสดงผลลัพธ์คั่นด้วยช่องว่างในบรรทัดเดียว",
                "input_description": "ชุดตัวเลขจำนวนเต็มคั่นด้วยช่องว่าง เช่น: 4 2 5 2 4 1 3",
                "output_description": "ตัวเลขที่ไม่ซ้ำกัน เรียงจากน้อยไปมาก คั่นด้วยช่องว่าง เช่น: 1 2 3 4 5",
                "constraints_text": "1 <= จำนวนตัวเลข <= 1,000",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "4 2 5 2 4 1 3", "expected_output": "1 2 3 4 5", "is_hidden": False, "points": 10},
                {"input_data": "10 20 10 30", "expected_output": "10 20 30", "is_hidden": False, "points": 10},
                {"input_data": "5 5 5 5 5", "expected_output": "5", "is_hidden": True, "points": 5},
                {"input_data": "-2 4 -2 0 10 -5", "expected_output": "-5 -2 0 4 10", "is_hidden": True, "points": 5},
            ],
        )

        # Problem 12: ตรวจสอบคำพาลินโดรม
        upsert_problem(
            "data-structures-in-python",
            {
                "title": "ตรวจสอบคำพาลินโดรม (Palindrome Checker)",
                "slug": "palindrome-checker",
                "description": "เขียนโปรแกรมรับข้อความ 1 บรรทัด แล้วตรวจสอบว่าเป็นคำพาลินโดรม (Palindrome) หรือไม่ (พาลินโดรมคือคำที่อ่านจากซ้ายไปขวาหรือขวาไปซ้ายแล้วเหมือนเดิม)\n\n*ข้อกำหนด:* การเปรียบเทียบไม่สนใจตัวพิมพ์เล็กหรือตัวพิมพ์ใหญ่ (Case-insensitive)\nถ้าเป็นพาลินโดรม ให้พิมพ์ 'YES' และถ้าไม่เป็น ให้พิมพ์ 'NO'",
                "input_description": "ข้อความ 1 บรรทัด เช่น: Racecar",
                "output_description": "คำว่า 'YES' หรือ 'NO'",
                "constraints_text": "1 <= ความยาวข้อความ <= 1000",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 15,
                "time_limit_ms": 1000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "Racecar", "expected_output": "YES", "is_hidden": False, "points": 5},
                {"input_data": "Python", "expected_output": "NO", "is_hidden": False, "points": 5},
                {"input_data": "Madam", "expected_output": "YES", "is_hidden": True, "points": 5},
                {"input_data": "Abba", "expected_output": "YES", "is_hidden": True, "points": 5},
                {"input_data": "Antigravity", "expected_output": "NO", "is_hidden": True, "points": 5},
            ],
        )

        logger.info("Successfully finished seeding Thai fundamental Python problems!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during Thai problems seeding: {e}")
        raise
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_thai_problems()
