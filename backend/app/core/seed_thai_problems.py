"""
Seed or update the database with comprehensive Thai fundamental Python problems.
Covers 8 core modules:
1. Basic: Variables, Input/Output, Arithmetic
2. Condition: If-Else, Elif, Comparison & Boolean Logic
3. Loop: For loops, While loops, Range, Iterations
4. String & Methods: Slicing, .split(), .join(), .replace(), .strip(), .title()
5. List & Methods: Indexing, Slicing, .append(), .pop(), .sort(), Comprehensions
6. Dict & Methods: Key-Value pairs, .get(), .items(), Frequencies
7. Function: def, parameters, return values, recursion
8. Recap: Comprehensive challenges combining multiple topics
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

        # 1. Unified Course definition (single consolidated course, no numbering prefix)
        UNIFIED_SLUG = "python-fundamentals"
        UNIFIED_TITLE = "แบบฝึกหัดเขียนโปรแกรมภาษา Python"
        UNIFIED_DESC = "รวมแบบฝึกหัดเขียนโปรแกรมภาษา Python ครบทุกหัวข้อสำคัญ ตั้งแต่พื้นฐาน ตัวแปร เงื่อนไข การวนซ้ำ สตริง ลิสต์ ดิกชันนารี ฟังก์ชัน ไปจนถึงโจทย์ประยุกต์ เรียงลำดับจากง่ายไปยาก"

        unified_course = db.query(Course).filter(Course.slug == UNIFIED_SLUG).first()
        if not unified_course:
            unified_course = db.query(Course).filter(Course.slug == "python-basics").first()

        if not unified_course:
            unified_course = Course(
                slug=UNIFIED_SLUG,
                title=UNIFIED_TITLE,
                description=UNIFIED_DESC,
                difficulty=Difficulty.EASY.value,
                is_published=True,
            )
            db.add(unified_course)
            db.flush()
        else:
            unified_course.slug = UNIFIED_SLUG
            unified_course.title = UNIFIED_TITLE
            unified_course.description = UNIFIED_DESC
            unified_course.difficulty = Difficulty.EASY.value
            unified_course.is_published = True
            db.flush()

        db.commit()

        # Helper function to upsert problem & test cases under unified course
        def upsert_problem(course_slug: str, prob_data: dict, test_cases_data: list):
            prob = db.query(Problem).filter(Problem.slug == prob_data["slug"]).first()
            if not prob:
                prob = Problem(course_id=unified_course.id, **prob_data)
                db.add(prob)
                db.flush()
                logger.info(f"Created new problem: {prob.title}")
            else:
                prob.course_id = unified_course.id
                for k, v in prob_data.items():
                    setattr(prob, k, v)
                db.flush()
                logger.info(f"Updated existing problem: {prob.title}")

            # Recreate test cases cleanly
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

        # ====================================================
        # 1. PYTHON BASICS & VARIABLES (python-basics)
        # ====================================================

        # 1.1 Calculate Sum
        upsert_problem(
            "python-basics",
            {
                "title": "คำนวณผลรวมสองจำนวน (Calculate Sum)",
                "slug": "calculate-sum",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม 2 จำนวนจากผู้ใช้ (ในบรรทัดเดียวกัน คั่นด้วยช่องว่าง) แล้วพิมพ์ผลรวมของตัวเลขทั้งสองออกมาทางหน้าจอ",
                "input_description": "จำนวนเต็ม A และ B คั่นด้วยช่องว่าง 1 บรรทัด เช่น: 5 7",
                "output_description": "พิมพ์ผลรวมของ A + B เป็นจำนวนเต็ม",
                "constraints_text": "-10^9 <= A, B <= 10^9",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
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

        # 1.2 Rectangle Area
        upsert_problem(
            "python-basics",
            {
                "title": "คำนวณพื้นที่สี่เหลี่ยมผืนผ้า (Rectangle Area)",
                "slug": "rectangle-area",
                "description": "เขียนโปรแกรมรับความกว้าง (Width) และความยาว (Height) ของรูปสี่เหลี่ยมผืนผ้า (บรรทัดละ 1 จำนวน) แล้วคำนวณพื้นที่ตามสูตร: พื้นที่ = กว้าง x ยาว",
                "input_description": "บรรทัดที่ 1: ความกว้าง (จำนวนเต็มบวกหรือทศนิยม)\nบรรทัดที่ 2: ความยาว (จำนวนเต็มบวกหรือทศนิยม)",
                "output_description": "พิมพ์ค่าพื้นที่ของสี่เหลี่ยมผืนผ้า (หากเป็นจำนวนเต็มให้พิมพ์เป็นจำนวนเต็ม)",
                "constraints_text": "1 <= Width, Height <= 10^6",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "5\n10", "expected_output": "50", "is_hidden": False, "points": 5},
                {"input_data": "12\n8", "expected_output": "96", "is_hidden": False, "points": 5},
                {"input_data": "7.5\n4", "expected_output": "30.0", "is_hidden": True, "points": 5},
                {"input_data": "100\n25", "expected_output": "2500", "is_hidden": True, "points": 5},
            ],
        )

        # 1.3 BMI Calculator
        upsert_problem(
            "python-basics",
            {
                "title": "คำนวณดัชนีมวลกาย (BMI Calculator)",
                "slug": "bmi-calculator",
                "description": "เขียนโปรแกรมรับค่าน้ำหนัก (กิโลกรัม) และส่วนสูง (เซนติเมตร) โดยแยกกันบรรทัดละค่า แล้วคำนวณค่าดัชนีมวลกาย (BMI) ตามสูตร:\n\nBMI = น้ำหนัก / ((ส่วนสูง / 100) ** 2)\n\nแล้วแสดงผลลัพธ์เป็นตัวเลขทศนิยม 2 ตำแหน่ง",
                "input_description": "บรรทัดที่ 1: น้ำหนัก (กิโลกรัม) เป็นตัวเลขทศนิยมหรือจำนวนเต็ม\nบรรทัดที่ 2: ส่วนสูง (เซนติเมตร) เป็นตัวเลขทศนิยมหรือจำนวนเต็ม",
                "output_description": "ค่า BMI เป็นตัวเลขทศนิยม 2 ตำแหน่ง (ตัวอย่าง: 22.86)",
                "constraints_text": "10.0 <= น้ำหนัก <= 300.0, 50.0 <= ส่วนสูง <= 250.0",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "70\n175", "expected_output": "22.86", "is_hidden": False, "points": 5},
                {"input_data": "50\n160", "expected_output": "19.53", "is_hidden": False, "points": 5},
                {"input_data": "85\n180", "expected_output": "26.23", "is_hidden": True, "points": 5},
                {"input_data": "45\n150", "expected_output": "20.00", "is_hidden": True, "points": 5},
            ],
        )

        # 1.4 Seconds Converter
        upsert_problem(
            "python-basics",
            {
                "title": "แปลงวินาทีเป็นรูปแบบเวลา (Seconds Converter)",
                "slug": "seconds-converter",
                "description": "เขียนโปรแกรมรับจำนวนวินาทีทั้งหมด (จำนวนเต็มบวก) แล้วแปลงเป็นเวลาในรูปแบบ HH:MM:SS (ชั่วโมง:นาที:วินาที โดยแสดงเลข 2 หลักเสมอ เช่น 01:05:09)",
                "input_description": "จำนวนเต็มบวก S แทนจำนวนวินาที",
                "output_description": "สตริงเวลาในรูปแบบ HH:MM:SS เช่น 01:01:05",
                "constraints_text": "0 <= S <= 359999",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "3665", "expected_output": "01:01:05", "is_hidden": False, "points": 5},
                {"input_data": "60", "expected_output": "00:01:00", "is_hidden": False, "points": 5},
                {"input_data": "0", "expected_output": "00:00:00", "is_hidden": True, "points": 5},
                {"input_data": "86399", "expected_output": "23:59:59", "is_hidden": True, "points": 5},
            ],
        )

        # ====================================================
        # 2. CONDITIONS & LOGIC (python-conditions)
        # ====================================================

        # 2.1 Even or Odd
        upsert_problem(
            "python-conditions",
            {
                "title": "ตรวจสอบเลขคู่หรือเลขคี่ (Even or Odd)",
                "slug": "even-or-odd",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม N จำนวน 1 ตัว แล้วตรวจสอบว่า N เป็นเลขคู่หรือเลขคี่\nถ้าเป็นเลขคู่ให้แสดงผลลัพธ์เป็นคำว่า 'Even' และถ้าเป็นเลขคี่ให้แสดงผลลัพธ์เป็นคำว่า 'Odd'",
                "input_description": "จำนวนเต็ม N จำนวน 1 ตัว เช่น: 4",
                "output_description": "คำว่า 'Even' หรือ 'Odd'",
                "constraints_text": "-10^6 <= N <= 10^6",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
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

        # 2.2 Grade Calculator
        upsert_problem(
            "python-conditions",
            {
                "title": "ระบบตัดเกรดผลการเรียน (Grade Calculator)",
                "slug": "grade-calculator",
                "description": "เขียนโปรแกรมรับคะแนนสอบของนักเรียน (จำนวนเต็ม 0 ถึง 100) แล้วตัดเกรดตามเกณฑ์ดังนี้:\n- 80 คะแนนขึ้นไป: A\n- 70 ถึง 79 คะแนน: B\n- 60 ถึง 69 คะแนน: C\n- 50 ถึง 59 คะแนน: D\n- ต่ำกว่า 50 คะแนน: F",
                "input_description": "จำนวนเต็มคะแนนสอบ S (0 <= S <= 100)",
                "output_description": "ตัวอักษรเกรด A, B, C, D หรือ F",
                "constraints_text": "0 <= S <= 100",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
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

        # 2.3 Leap Year Checker
        upsert_problem(
            "python-conditions",
            {
                "title": "ตรวจสอบปีอธิกสุรทิน (Leap Year Checker)",
                "slug": "leap-year-checker",
                "description": "เขียนโปรแกรมตรวจสอบว่าปี ค.ศ. ที่รับเข้ามา เป็นปีอธิกสุรทิน (Leap Year) ที่มี 366 วันหรือไม่\n\nเงื่อนไข:\n1. ปีนั้นต้องหารด้วย 4 ลงตัว\n2. แต่ถ้าปีนั้นหารด้วย 100 ลงตัวด้วย จะต้องหารด้วย 400 ลงตัวด้วย จึงจะเป็นปีอธิกสุรทิน\n\nถ้าเป็นปีอธิกสุรทิน ให้พิมพ์ 'Leap Year' และถ้าไม่เป็น ให้พิมพ์ 'Not a Leap Year'",
                "input_description": "จำนวนเต็มปี ค.ศ. เช่น: 2024",
                "output_description": "คำว่า 'Leap Year' หรือ 'Not a Leap Year'",
                "constraints_text": "1 <= ปี ค.ศ. <= 9999",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "2024", "expected_output": "Leap Year", "is_hidden": False, "points": 5},
                {"input_data": "1900", "expected_output": "Not a Leap Year", "is_hidden": False, "points": 5},
                {"input_data": "2000", "expected_output": "Leap Year", "is_hidden": True, "points": 5},
                {"input_data": "2023", "expected_output": "Not a Leap Year", "is_hidden": True, "points": 5},
            ],
        )

        # 2.4 Max of Three Numbers
        upsert_problem(
            "python-conditions",
            {
                "title": "หาค่ามากที่สุดใน 3 จำนวน (Max of Three)",
                "slug": "max-of-three",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม 3 จำนวนในบรรทัดเดียว (คั่นด้วยช่องว่าง) แล้วค้นหาว่าตัวเลขใดมีค่ามากที่สุด และแสดงตัวเลขนั้นออกมา",
                "input_description": "จำนวนเต็ม 3 จำนวนคั่นด้วยช่องว่าง เช่น: 10 25 7",
                "output_description": "ตัวเลขที่มีค่ามากที่สุด",
                "constraints_text": "-10^9 <= แต่ละค่า <= 10^9",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "10 25 7", "expected_output": "25", "is_hidden": False, "points": 5},
                {"input_data": "-5 -20 -1", "expected_output": "-1", "is_hidden": False, "points": 5},
                {"input_data": "100 100 50", "expected_output": "100", "is_hidden": True, "points": 5},
                {"input_data": "0 0 0", "expected_output": "0", "is_hidden": True, "points": 5},
            ],
        )

        # 2.5 Quadrant Finder
        upsert_problem(
            "python-conditions",
            {
                "title": "หาจตุภาคของพิกัดระนาบ (Quadrant Finder)",
                "slug": "quadrant-finder",
                "description": "เขียนโปรแกรมรับพิกัด X และ Y (คั่นด้วยช่องว่าง) บนระนาบ 2 มิติ แล้วระบุว่าพิกัดนั้นอยู่ในจตุภาคใด:\n- X > 0, Y > 0: 'Quadrant 1'\n- X < 0, Y > 0: 'Quadrant 2'\n- X < 0, Y < 0: 'Quadrant 3'\n- X > 0, Y < 0: 'Quadrant 4'\n- X == 0 และ Y == 0: 'Origin'\n- X == 0 หรือ Y == 0: 'Axis'",
                "input_description": "จำนวนเต็ม X และ Y คั่นด้วยช่องว่าง เช่น: 3 5",
                "output_description": "ชื่อตำแหน่งพิกัดตามเงื่อนไข",
                "constraints_text": "-10^6 <= X, Y <= 10^6",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "3 5", "expected_output": "Quadrant 1", "is_hidden": False, "points": 5},
                {"input_data": "-4 2", "expected_output": "Quadrant 2", "is_hidden": False, "points": 5},
                {"input_data": "-2 -7", "expected_output": "Quadrant 3", "is_hidden": True, "points": 5},
                {"input_data": "5 -1", "expected_output": "Quadrant 4", "is_hidden": True, "points": 5},
                {"input_data": "0 0", "expected_output": "Origin", "is_hidden": True, "points": 5},
                {"input_data": "0 8", "expected_output": "Axis", "is_hidden": True, "points": 5},
            ],
        )

        # ====================================================
        # 3. LOOPS & ITERATIONS (python-loops)
        # ====================================================

        # 3.1 Multiplication Table
        upsert_problem(
            "python-loops",
            {
                "title": "สูตรคูณแม่ N (Multiplication Table)",
                "slug": "multiplication-table",
                "description": "เขียนโปรแกรมรับจำนวนเต็มบวก N แล้วแสดงสูตรคูณแม่ N ตั้งแต่คูณ 1 จนถึงคูณ 12 แต่ละบรรทัดในรูปแบบ:\n\nN x i = Result\n\n(เว้นวรรคระหว่างเครื่องหมาย x และ = ตามตัวอย่าง)",
                "input_description": "จำนวนเต็มบวก N จำนวน 1 ตัว เช่น: 2",
                "output_description": "สูตรคูณ 12 บรรทัด ตั้งแต่ N x 1 จนถึง N x 12",
                "constraints_text": "1 <= N <= 100",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
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

        # 3.2 Sum of Even Numbers
        upsert_problem(
            "python-loops",
            {
                "title": "หาผลรวมของเลขคู่ตั้งแต่ 1 ถึง N (Sum of Even Numbers)",
                "slug": "sum-of-even-numbers",
                "description": "เขียนโปรแกรมรับจำนวนเต็มบวก N แล้วหาผลรวมของตัวเลขคู่ทั้งหมดที่อยู่ระหว่าง 1 ถึง N (เช่น ถ้า N=10 ผลรวมคือ 2 + 4 + 6 + 8 + 10 = 30)",
                "input_description": "จำนวนเต็มบวก N จำนวน 1 ตัว เช่น: 10",
                "output_description": "ผลรวมของเลขคู่ตั้งแต่ 1 ถึง N",
                "constraints_text": "1 <= N <= 100,000",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "10", "expected_output": "30", "is_hidden": False, "points": 5},
                {"input_data": "5", "expected_output": "6", "is_hidden": False, "points": 5},
                {"input_data": "1", "expected_output": "0", "is_hidden": True, "points": 5},
                {"input_data": "20", "expected_output": "110", "is_hidden": True, "points": 5},
            ],
        )

        # 3.3 Factorial Calculator
        upsert_problem(
            "python-loops",
            {
                "title": "คำนวณค่าแฟกทอเรียล N! (Factorial Calculator)",
                "slug": "factorial-calculator",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม N (0 <= N <= 20) แล้วคำนวณหาค่า N! (N แฟกทอเรียล)\nโดย 0! = 1 และ N! = 1 x 2 x 3 x ... x N",
                "input_description": "จำนวนเต็มบวกหรือศูนย์ N",
                "output_description": "ผลลัพธ์ค่า N! เป็นจำนวนเต็ม",
                "constraints_text": "0 <= N <= 20",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "5", "expected_output": "120", "is_hidden": False, "points": 5},
                {"input_data": "0", "expected_output": "1", "is_hidden": False, "points": 5},
                {"input_data": "7", "expected_output": "5040", "is_hidden": True, "points": 5},
                {"input_data": "10", "expected_output": "3628800", "is_hidden": True, "points": 5},
            ],
        )

        # 3.4 Star Pyramid
        upsert_problem(
            "python-loops",
            {
                "title": "สร้างพีระมิดดาว (Star Pyramid)",
                "slug": "star-pyramid",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม N แล้วพิมพ์พีระมิดดาวที่มีความสูง N แถว โดยแถวที่ i (เริ่มจาก 1 ถึง N) มีช่องว่างนำหน้า N - i ตัว และมีเครื่องหมายดาว (*) จำนวน 2*i - 1 ตัว",
                "input_description": "จำนวนเต็ม N แทนความสูงของพีระมิด เช่น: 3",
                "output_description": "พีระมิดดาวตามตัวอย่าง",
                "constraints_text": "1 <= N <= 30",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "3", "expected_output": "  *\n ***\n*****", "is_hidden": False, "points": 5},
                {"input_data": "4", "expected_output": "   *\n  ***\n *****\n*******", "is_hidden": False, "points": 5},
                {"input_data": "1", "expected_output": "*", "is_hidden": True, "points": 5},
            ],
        )

        # 3.5 Countdown Blastoff
        upsert_problem(
            "python-loops",
            {
                "title": "นับถอยหลังปล่อยจรวด (Countdown Blastoff)",
                "slug": "countdown-blastoff",
                "description": "เขียนโปรแกรมรับจำนวนเต็ม N แล้วนับถอยหลังตั้งแต่ N, N-1, ..., 1 บรรทัดละจำนวน แล้วในบรรทัดสุดท้ายพิมพ์คำว่า 'Blastoff!'",
                "input_description": "จำนวนเต็มบวก N เช่น: 3",
                "output_description": "ตัวเลขนับถอยหลังและคำว่า Blastoff!",
                "constraints_text": "1 <= N <= 100",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "3", "expected_output": "3\n2\n1\nBlastoff!", "is_hidden": False, "points": 5},
                {"input_data": "5", "expected_output": "5\n4\n3\n2\n1\nBlastoff!", "is_hidden": False, "points": 5},
                {"input_data": "1", "expected_output": "1\nBlastoff!", "is_hidden": True, "points": 5},
            ],
        )

        # ====================================================
        # 4. STRINGS & STRING METHODS (python-strings)
        # ====================================================

        # 4.1 Reverse a String
        upsert_problem(
            "python-strings",
            {
                "title": "กลับลำดับข้อความ (Reverse a String)",
                "slug": "reverse-a-string",
                "description": "เขียนโปรแกรมรับข้อความสตริง 1 บรรทัดจากผู้ใช้ แล้วแสดงข้อความเดิมแต่กลับตัวอักษรจากหลังมาหน้า",
                "input_description": "ข้อความ 1 บรรทัด เช่น: python",
                "output_description": "ข้อความที่กลับลำดับแล้ว เช่น: nohtyp",
                "constraints_text": "1 <= ความยาวสตริง <= 1000",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "python", "expected_output": "nohtyp", "is_hidden": False, "points": 5},
                {"input_data": "Hello World", "expected_output": "dlroW olleH", "is_hidden": False, "points": 5},
                {"input_data": "racecar", "expected_output": "racecar", "is_hidden": True, "points": 5},
            ],
        )

        # 4.2 Vowel Counter
        upsert_problem(
            "python-strings",
            {
                "title": "นับจำนวนสระภาษาอังกฤษ (Vowel Counter)",
                "slug": "vowel-counter",
                "description": "เขียนโปรแกรมรับข้อความภาษาอังกฤษ 1 บรรทัด แล้วนับว่ามีตัวอักษรที่เป็นสระ (Vowels: a, e, i, o, u) ทั้งหมดกี่ตัว โดยไม่แยกตัวพิมพ์เล็กหรือตัวพิมพ์ใหญ่",
                "input_description": "ข้อความภาษาอังกฤษ 1 บรรทัด เช่น: Hello World",
                "output_description": "จำนวนสระทั้งหมดที่พบในข้อความ แสดงเป็นจำนวนเต็มตัวเดียว",
                "constraints_text": "1 <= ความยาวข้อความ <= 1000",
                "difficulty": Difficulty.EASY.value,
                "points": 10,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "Hello World", "expected_output": "3", "is_hidden": False, "points": 5},
                {"input_data": "Python Programming", "expected_output": "4", "is_hidden": False, "points": 5},
                {"input_data": "AEIOU aeiou", "expected_output": "10", "is_hidden": True, "points": 5},
                {"input_data": "rhythm fly dry", "expected_output": "0", "is_hidden": True, "points": 5},
            ],
        )

        # 4.3 Palindrome Checker
        upsert_problem(
            "python-strings",
            {
                "title": "ตรวจสอบคำพาลินโดรม (Palindrome Checker)",
                "slug": "palindrome-checker",
                "description": "เขียนโปรแกรมรับข้อความ 1 บรรทัด แล้วตรวจสอบว่าเป็นคำพาลินโดรม (อ่านจากหน้าไปหลังหรือหลังมาหน้าเหมือนกัน) หรือไม่ โดยไม่สนใจตัวพิมพ์เล็ก-ใหญ่ (Case-insensitive) ถ้าใช่พิมพ์ 'YES' ถ้าไม่ใช่พิมพ์ 'NO'",
                "input_description": "ข้อความ 1 บรรทัด เช่น: Racecar",
                "output_description": "คำว่า 'YES' หรือ 'NO'",
                "constraints_text": "1 <= ความยาวข้อความ <= 1000",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "Racecar", "expected_output": "YES", "is_hidden": False, "points": 5},
                {"input_data": "Python", "expected_output": "NO", "is_hidden": False, "points": 5},
                {"input_data": "Madam", "expected_output": "YES", "is_hidden": True, "points": 5},
                {"input_data": "Abba", "expected_output": "YES", "is_hidden": True, "points": 5},
            ],
        )

        # 4.4 Word Censor
        upsert_problem(
            "python-strings",
            {
                "title": "ระบบเซ็นเซอร์คำไม่สุภาพ (Word Censor with .replace())",
                "slug": "word-censor",
                "description": "เขียนโปรแกรมรับข้อความ 2 บรรทัด:\nบรรทัดที่ 1: ประโยคข้อความทั้งหมด\nบรรทัดที่ 2: คำที่ต้องการเซ็นเซอร์\nให้แทนที่คำดังกล่าวในประโยคด้วยเครื่องหมายดอกจัน '***' ทั้งหมด",
                "input_description": "บรรทัดที่ 1: ประโยคข้อความ\nบรรทัดที่ 2: คำที่ต้องการแทนที่",
                "output_description": "ประโยคที่ถูกเซ็นเซอร์คำเรียบร้อยแล้ว",
                "constraints_text": "1 <= ความยาวประโยค <= 1000",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "This is a bad word\nbad", "expected_output": "This is a *** word", "is_hidden": False, "points": 5},
                {"input_data": "apple banana apple cherry\napple", "expected_output": "*** banana *** cherry", "is_hidden": False, "points": 5},
                {"input_data": "Hello world\nworld", "expected_output": "Hello ***", "is_hidden": True, "points": 5},
            ],
        )

        # 4.5 Acronym Generator
        upsert_problem(
            "python-strings",
            {
                "title": "สร้างตัวย่อจากอักษรตัวแรก (Acronym Generator with .split())",
                "slug": "acronym-generator",
                "description": "เขียนโปรแกรมรับข้อความภาษาอังกฤษ 1 บรรทัด แล้วนำตัวอักษรตัวแรกของแต่ละคำมาต่อกันเป็นตัวพิมพ์ใหญ่ (Upper case) เพื่อสร้างเป็นตัวย่อของคำนั้น",
                "input_description": "ข้อความภาษาอังกฤษ 1 บรรทัด เช่น: artificial intelligence",
                "output_description": "ตัวย่อภาษาอังกฤษตัวพิมพ์ใหญ่ เช่น: AI",
                "constraints_text": "1 <= ความยาวข้อความ <= 1000",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "artificial intelligence", "expected_output": "AI", "is_hidden": False, "points": 5},
                {"input_data": "as soon as possible", "expected_output": "ASAP", "is_hidden": False, "points": 5},
                {"input_data": "Hyper Text Markup Language", "expected_output": "HTML", "is_hidden": True, "points": 5},
                {"input_data": "central processing unit", "expected_output": "CPU", "is_hidden": True, "points": 5},
            ],
        )

        # ====================================================
        # 5. LISTS & LIST METHODS (python-lists)
        # ====================================================

        # 5.1 Find Maximum Value
        upsert_problem(
            "python-lists",
            {
                "title": "หาค่าสูงสุดในชุดตัวเลข (Find Maximum Value)",
                "slug": "find-the-maximum-value",
                "description": "เขียนโปรแกรมรับชุดตัวเลขจำนวนเต็มหลายจำนวนในบรรทัดเดียว (คั่นด้วยช่องว่าง) แล้วค้นหาพร้อมพิมพ์ค่าตัวเลขที่มากที่สุดในชุดข้อมูลนั้นออกมา",
                "input_description": "ตัวเลขจำนวนเต็มหลายตัวคั่นด้วยช่องว่าง เช่น: 3 7 2 9 5",
                "output_description": "ตัวเลขที่มากที่สุดจำนวนเดียว เช่น: 9",
                "constraints_text": "1 <= จำนวนตัวเลข <= 10^5, -10^9 <= แต่ละค่า <= 10^9",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "3 7 2 9 5", "expected_output": "9", "is_hidden": False, "points": 5},
                {"input_data": "-5 -1 -10 -20", "expected_output": "-1", "is_hidden": False, "points": 5},
                {"input_data": "42", "expected_output": "42", "is_hidden": True, "points": 5},
            ],
        )

        # 5.2 Unique and Sorted Numbers
        upsert_problem(
            "python-lists",
            {
                "title": "ตัดข้อมูลที่ซ้ำและเรียงลำดับ (Unique & Sorted Numbers)",
                "slug": "unique-and-sorted",
                "description": "เขียนโปรแกรมรับชุดตัวเลขจำนวนเต็มหลายจำนวนในบรรทัดเดียว จากนั้นนำตัวเลขมากำจัดค่าที่ซ้ำกันออก แล้วเรียงลำดับจากน้อยไปหามาก และแสดงผลลัพธ์คั่นด้วยช่องว่างในบรรทัดเดียว",
                "input_description": "ชุดตัวเลขจำนวนเต็มคั่นด้วยช่องว่าง เช่น: 4 2 5 2 4 1 3",
                "output_description": "ตัวเลขที่ไม่ซ้ำกัน เรียงจากน้อยไปมาก คั่นด้วยช่องว่าง เช่น: 1 2 3 4 5",
                "constraints_text": "1 <= จำนวนตัวเลข <= 1,000",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "4 2 5 2 4 1 3", "expected_output": "1 2 3 4 5", "is_hidden": False, "points": 10},
                {"input_data": "10 20 10 30", "expected_output": "10 20 30", "is_hidden": False, "points": 10},
                {"input_data": "5 5 5 5 5", "expected_output": "5", "is_hidden": True, "points": 5},
            ],
        )

        # 5.3 Filter Even Numbers
        upsert_problem(
            "python-lists",
            {
                "title": "คัดกรองเฉพาะเลขคู่จากลิสต์ (Filter Even Numbers)",
                "slug": "filter-even-numbers",
                "description": "เขียนโปรแกรมรับชุดตัวเลขจำนวนเต็มคั่นด้วยช่องว่าง คัดกรองเอาเฉพาะตัวเลขที่เป็นเลขคู่ พิมพ์เรียงตามลำดับเดิม คั่นด้วยช่องว่าง (ถ้าไม่มีเลขคู่เลย ให้พิมพ์คำว่า 'None')",
                "input_description": "ชุดตัวเลขจำนวนเต็ม เช่น: 1 2 3 4 5 6 7 8",
                "output_description": "เฉพาะเลขคู่คั่นด้วยช่องว่าง หรือ 'None'",
                "constraints_text": "1 <= จำนวนตัวเลข <= 10^4",
                "difficulty": Difficulty.EASY.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "1 2 3 4 5 6 7 8", "expected_output": "2 4 6 8", "is_hidden": False, "points": 5},
                {"input_data": "1 3 5 7", "expected_output": "None", "is_hidden": False, "points": 5},
                {"input_data": "10 21 32 43 54", "expected_output": "10 32 54", "is_hidden": True, "points": 5},
            ],
        )

        # 5.4 Cumulative Sum List
        upsert_problem(
            "python-lists",
            {
                "title": "ผลรวมสะสมของลิสต์ (Cumulative Sum / Prefix Sum)",
                "slug": "cumulative-sum",
                "description": "เขียนโปรแกรมรับชุดตัวเลขจำนวนเต็ม 1 บรรทัด แล้วสร้างชุดข้อมูลใหม่ที่เป็นผลรวมสะสม (Cumulative Sum) ตั้งแต่ตัวแรกถึงตำแหน่งปัจจุบัน คั่นด้วยช่องว่าง",
                "input_description": "ชุดตัวเลขจำนวนเต็ม เช่น: 1 2 3 4 5",
                "output_description": "ผลรวมสะสมของแต่ละตำแหน่ง เช่น: 1 3 6 10 15",
                "constraints_text": "1 <= จำนวนตัวเลข <= 10^4",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "1 2 3 4 5", "expected_output": "1 3 6 10 15", "is_hidden": False, "points": 5},
                {"input_data": "10 -2 5", "expected_output": "10 8 13", "is_hidden": False, "points": 5},
                {"input_data": "7", "expected_output": "7", "is_hidden": True, "points": 5},
            ],
        )

        # ====================================================
        # 6. DICTIONARIES & DICT METHODS (python-dicts)
        # ====================================================

        # 6.1 Character Frequency
        upsert_problem(
            "python-dicts",
            {
                "title": "นับความถี่ตัวอักษร (Character Frequency Counter)",
                "slug": "character-frequency",
                "description": "เขียนโปรแกรมรับข้อความ 1 บรรทัด นับว่าตัวอักษรแต่ละตัว (ไม่นับช่องว่าง ไม่แยกตัวเล็ก-ใหญ่ ให้แปลงเป็นตัวพิมพ์เล็กทั้งหมด) ปรากฏกี่ครั้ง แล้วแสดงผลเรียงตามลำดับตัวอักษร a-z ในรูปแบบ 'char: count' บรรทัดละ 1 ตัว",
                "input_description": "ข้อความ 1 บรรทัด เช่น: banana",
                "output_description": "รายการตัวอักษรและจำนวนครั้ง เรียงลำดับตัวอักษร เช่น:\na: 3\nb: 1\nn: 2",
                "constraints_text": "1 <= ความยาวข้อความ <= 10^4",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "banana", "expected_output": "a: 3\nb: 1\nn: 2", "is_hidden": False, "points": 10},
                {"input_data": "Hello", "expected_output": "e: 1\nh: 1\nl: 2\no: 1", "is_hidden": False, "points": 10},
                {"input_data": "Aa Bb Aa", "expected_output": "a: 4\nb: 2", "is_hidden": True, "points": 5},
            ],
        )

        # 6.2 Word Frequency
        upsert_problem(
            "python-dicts",
            {
                "title": "นับความถี่ของคำที่พบบ่อยที่สุด (Most Frequent Word)",
                "slug": "word-frequency",
                "description": "เขียนโปรแกรมรับประโยค 1 บรรทัด นับจำนวนครั้งที่แต่ละคำปรากฏ (ไม่แยกตัวพิมพ์เล็ก-ใหญ่ ให้แปลงเป็นตัวพิมพ์เล็กทั้งหมด) แล้วพิมพ์คำที่ปรากฏบ่อยที่สุด พร้อมจำนวนครั้ง คั่นด้วยช่องว่าง (หากมีความถี่สูงสุดเท่ากันหลายคำ ให้เลือกคำที่เรียงลำดับพจนานุกรมมาก่อน)",
                "input_description": "ประโยคข้อความ เช่น: apple orange banana apple apple banana",
                "output_description": "คำที่พบบ่อยที่สุดและจำนวนครั้ง เช่น: apple 3",
                "constraints_text": "1 <= จำนวนคำในประโยค <= 10^4",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "apple orange banana apple apple banana", "expected_output": "apple 3", "is_hidden": False, "points": 10},
                {"input_data": "cat dog bird cat dog bird cat", "expected_output": "cat 3", "is_hidden": False, "points": 10},
                {"input_data": "Blue green red blue green", "expected_output": "blue 2", "is_hidden": True, "points": 5},
            ],
        )

        # 6.3 Student Score Lookup
        upsert_problem(
            "python-dicts",
            {
                "title": "ระบบค้นหาคะแนนสูงสุดและเฉลี่ย (Student Score Summary)",
                "slug": "student-score-lookup",
                "description": "บรรทัดที่ 1 รับจำนวนนักเรียน N (N >= 1)\nจากนั้น N บรรทัดถัดมา แต่ละบรรทัดประกอบด้วย 'ชื่อ คะแนน' (คั่นด้วยช่องว่าง)\nให้ค้นหาว่าใครได้คะแนนสูงสุด และคะแนนเฉลี่ยของทุกคนเป็นเท่าใด (ทศนิยม 2 ตำแหน่ง) แสดงผล 2 บรรทัด:\nTop: Name (Score)\nAverage: Avg",
                "input_description": "จำนวนนักเรียน N ตามด้วย N บรรทัดของ ชื่อและคะแนน",
                "output_description": "2 บรรทัดแสดงนักเรียนคะแนนสูงสุดและคะแนนเฉลี่ย",
                "constraints_text": "1 <= N <= 1000, 0 <= คะแนน <= 100",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {
                    "input_data": "3\nAlice 85\nBob 92\nCharlie 78",
                    "expected_output": "Top: Bob (92)\nAverage: 85.00",
                    "is_hidden": False,
                    "points": 10,
                },
                {
                    "input_data": "2\nJohn 90\nJane 90",
                    "expected_output": "Top: John (90)\nAverage: 90.00",
                    "is_hidden": False,
                    "points": 10,
                },
                {
                    "input_data": "1\nSomsak 100",
                    "expected_output": "Top: Somsak (100)\nAverage: 100.00",
                    "is_hidden": True,
                    "points": 5,
                },
            ],
        )

        # ====================================================
        # 7. FUNCTIONS & SCOPE (python-functions)
        # ====================================================

        # 7.1 Prime Number Function
        upsert_problem(
            "python-functions",
            {
                "title": "ฟังก์ชันตรวจสอบจำนวนเฉพาะ (Prime Number Function)",
                "slug": "is-prime-function",
                "description": "เขียนฟังก์ชันตรวจสอบว่าจำนวนเต็มบวก N เป็นจำนวนเฉพาะ (Prime Number) หรือไม่ ถ้าเป็นให้พิมพ์ 'Prime' ถ้าไม่เป็นให้พิมพ์ 'Not Prime' (หมายเหตุ: จำนวนที่น้อยกว่าหรือเท่ากับ 1 ไม่ใช่จำนวนเฉพาะ)",
                "input_description": "จำนวนเต็มบวก N เช่น: 7",
                "output_description": "คำว่า 'Prime' หรือ 'Not Prime'",
                "constraints_text": "1 <= N <= 10^7",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 15,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "7", "expected_output": "Prime", "is_hidden": False, "points": 5},
                {"input_data": "10", "expected_output": "Not Prime", "is_hidden": False, "points": 5},
                {"input_data": "1", "expected_output": "Not Prime", "is_hidden": True, "points": 5},
                {"input_data": "2", "expected_output": "Prime", "is_hidden": True, "points": 5},
                {"input_data": "97", "expected_output": "Prime", "is_hidden": True, "points": 5},
            ],
        )

        # 7.2 GCD & LCM
        upsert_problem(
            "python-functions",
            {
                "title": "ฟังก์ชันหา ห.ร.ม. และ ค.ร.น. (GCD & LCM)",
                "slug": "gcd-and-lcm",
                "description": "เขียนฟังก์ชันคำนวณหา ห.ร.ม. (Greatest Common Divisor) และ ค.ร.น. (Least Common Multiple) ของจำนวนเต็มบวก 2 จำนวน A และ B แล้วแสดงผลลัพธ์ในบรรทัดเดียวกันคั่นด้วยช่องว่าง: 'GCD LCM'",
                "input_description": "จำนวนเต็มบวก 2 จำนวน A และ B คั่นด้วยช่องว่าง เช่น: 12 18",
                "output_description": "ค่า ห.ร.ม. และ ค.ร.น. คั่นด้วยช่องว่าง เช่น: 6 36",
                "constraints_text": "1 <= A, B <= 10^9",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "12 18", "expected_output": "6 36", "is_hidden": False, "points": 10},
                {"input_data": "5 7", "expected_output": "1 35", "is_hidden": False, "points": 10},
                {"input_data": "20 20", "expected_output": "20 20", "is_hidden": True, "points": 5},
            ],
        )

        # 7.3 Fibonacci Term
        upsert_problem(
            "python-functions",
            {
                "title": "ฟังก์ชันหาพจน์ฟีโบนัชชีตัวที่ N (Fibonacci N-th Term)",
                "slug": "fibonacci-term",
                "description": "เขียนฟังก์ชันหาค่าลำดับฟีโบนัชชีพจน์ที่ N โดยกำหนด F(0) = 0, F(1) = 1 และ F(N) = F(N-1) + F(N-2) สำหรับ N >= 2",
                "input_description": "จำนวนเต็มบวกหรือศูนย์ N เช่น: 6",
                "output_description": "ค่าของ F(N)",
                "constraints_text": "0 <= N <= 35",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "0", "expected_output": "0", "is_hidden": False, "points": 5},
                {"input_data": "1", "expected_output": "1", "is_hidden": False, "points": 5},
                {"input_data": "6", "expected_output": "8", "is_hidden": False, "points": 5},
                {"input_data": "10", "expected_output": "55", "is_hidden": True, "points": 5},
                {"input_data": "20", "expected_output": "6765", "is_hidden": True, "points": 5},
            ],
        )

        # ====================================================
        # 8. COMPREHENSIVE RECAP (python-recap)
        # ====================================================

        # 8.1 Shopping Cart Bill
        upsert_problem(
            "python-recap",
            {
                "title": "ระบบคำนวณบิลตะกร้าสินค้า (Shopping Cart Bill)",
                "slug": "shopping-cart-bill",
                "description": "เขียนโปรแกรมรับรายการสินค้าในตะกร้า:\nบรรทัดที่ 1: จำนวนสินค้า N\nN บรรทัดถัดมา: 'ชื่อ จำนวน ราคาต่อหน่วย' (คั่นด้วยช่องว่าง)\n\nเงื่อนไขการคิดราคา:\n1. รวมราคาสินค้าทั้งหมดเป็น Subtotal\n2. หาก Subtotal >= 1000 บาท ได้รับส่วนลด Discount 10% (ถ้าไม่ถึง ส่วนลดคือ 0.00)\n3. ยอดหลังหักส่วนลดจะถูกคิดภาษีมูลค่าเพิ่ม VAT 7%\n4. ราคาสุทธิ Net Total = (Subtotal - Discount) + VAT\n\nแสดงผล 3 บรรทัด ทศนิยม 2 ตำแหน่ง:\nSubtotal: X.XX\nDiscount: X.XX\nNet Total: X.XX",
                "input_description": "บรรทัดที่ 1: N\nN บรรทัด: ItemName Quantity Price",
                "output_description": "3 บรรทัดแสดง Subtotal, Discount และ Net Total",
                "constraints_text": "1 <= N <= 100",
                "difficulty": Difficulty.HARD.value,
                "points": 25,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {
                    "input_data": "2\nBook 2 300\nPen 4 50",
                    "expected_output": "Subtotal: 800.00\nDiscount: 0.00\nNet Total: 856.00",
                    "is_hidden": False,
                    "points": 10,
                },
                {
                    "input_data": "1\nLaptop 1 20000",
                    "expected_output": "Subtotal: 20000.00\nDiscount: 2000.00\nNet Total: 19260.00",
                    "is_hidden": False,
                    "points": 10,
                },
                {
                    "input_data": "3\nApple 5 20\nMilk 2 45\nBread 3 30",
                    "expected_output": "Subtotal: 280.00\nDiscount: 0.00\nNet Total: 299.60",
                    "is_hidden": True,
                    "points": 5,
                },
            ],
        )

        # 8.2 Anagram Checker
        upsert_problem(
            "python-recap",
            {
                "title": "ตรวจสอบคู่คำแอนาแกรม (Anagram Checker)",
                "slug": "anagram-checker",
                "description": "เขียนโปรแกรมรับข้อความ 2 บรรทัด แล้วตรวจสอบว่าข้อความทั้งสองเป็น Anagram กันหรือไม่ (คำหรือข้อความที่ประกอบขึ้นจากชุดตัวอักษรเดียวกันในจำนวนเท่ากัน โดยไม่สนใจช่องว่างและไม่สนใจตัวพิมพ์เล็ก-ใหญ่)\nถ้าเป็น Anagram ให้พิมพ์ 'Anagram' ถ้าไม่ใช่ให้พิมพ์ 'Not Anagram'",
                "input_description": "ข้อความ 2 บรรทัด เช่น:\nListen\nSilent",
                "output_description": "คำว่า 'Anagram' หรือ 'Not Anagram'",
                "constraints_text": "1 <= ความยาวข้อความ <= 1000",
                "difficulty": Difficulty.MEDIUM.value,
                "points": 20,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {"input_data": "Listen\nSilent", "expected_output": "Anagram", "is_hidden": False, "points": 10},
                {"input_data": "Dormitory\nDirty Room", "expected_output": "Anagram", "is_hidden": False, "points": 10},
                {"input_data": "Hello\nWorld", "expected_output": "Not Anagram", "is_hidden": True, "points": 5},
                {"input_data": "Astronomer\nMoon starer", "expected_output": "Anagram", "is_hidden": True, "points": 5},
            ],
        )

        # 8.3 Student Ranking System
        upsert_problem(
            "python-recap",
            {
                "title": "ระบบจัดอันดับและตัดเกรดนักเรียน (Student Ranking & Grading)",
                "slug": "student-ranking",
                "description": "บรรทัดที่ 1 รับจำนวนนักเรียน N (N >= 1)\nN บรรทัดถัดมา: 'ชื่อ คะแนน' (คั่นด้วยช่องว่าง)\n\nให้จัดเรียงลำดับจากคะแนนมากไปหาน้อย (หากคะแนนเท่ากัน ให้เรียงตามชื่อตามพจนานุกรม a-z) พร้อมทั้งตัดเกรดตามเกณฑ์:\n>=80: A, >=70: B, >=60: C, >=50: D, <50: F\n\nแสดงผลลัพธ์บรรทัดละคนในรูปแบบ:\n'Rank Name Score Grade' (เริ่มอันดับที่ 1 เสมอ)",
                "input_description": "จำนวนนักเรียน N ตามด้วย N บรรทัดของ Name Score",
                "output_description": "อันดับ 1 ถึง N ตามรูปแบบที่กำหนด",
                "constraints_text": "1 <= N <= 1000",
                "difficulty": Difficulty.HARD.value,
                "points": 25,
                "time_limit_ms": 2000,
                "memory_limit_mb": 128,
                "is_published": True,
            },
            [
                {
                    "input_data": "3\nBob 75\nAlice 88\nCharlie 62",
                    "expected_output": "1 Alice 88 A\n2 Bob 75 B\n3 Charlie 62 C",
                    "is_hidden": False,
                    "points": 10,
                },
                {
                    "input_data": "4\nDavid 45\nAnna 95\nBen 80\nChris 80",
                    "expected_output": "1 Anna 95 A\n2 Ben 80 A\n3 Chris 80 A\n4 David 45 F",
                    "is_hidden": False,
                    "points": 10,
                },
                {
                    "input_data": "2\nZack 55\nAlex 55",
                    "expected_output": "1 Alex 55 D\n2 Zack 55 D",
                    "is_hidden": True,
                    "points": 5,
                },
            ],
        )

        # Remove any other split courses so only the single unified course remains
        db.query(Course).filter(Course.id != unified_course.id).delete(synchronize_session=False)
        db.commit()

        logger.info("Successfully finished seeding comprehensive Thai fundamental Python problems under single unified course!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during Thai problems seeding: {e}")
        raise
    finally:
        if close_db:
            db.close()


if __name__ == "__main__":
    seed_thai_problems()
