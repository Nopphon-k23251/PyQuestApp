from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.course import Course, Difficulty
from app.models.problem import Problem
from app.models.problem_star import ProblemStar
from app.models.user_problem_progress import UserProblemProgress
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseDetailResponse
from app.schemas.problem import ProblemListItemResponse
from app.repositories.course_repository import CourseRepository


# 8-Module curriculum order from easy to hard
PROBLEM_TOPIC_CONFIG = [
    # 1. Basic (Easy)
    ("calculate-sum", "พื้นฐานและตัวแปร"),
    ("rectangle-area", "พื้นฐานและตัวแปร"),
    ("bmi-calculator", "พื้นฐานและตัวแปร"),
    ("seconds-converter", "พื้นฐานและตัวแปร"),

    # 2. Condition (Easy)
    ("even-or-odd", "เงื่อนไขและการตัดสินใจ"),
    ("grade-calculator", "เงื่อนไขและการตัดสินใจ"),
    ("leap-year-checker", "เงื่อนไขและการตัดสินใจ"),
    ("max-of-three", "เงื่อนไขและการตัดสินใจ"),
    ("quadrant-finder", "เงื่อนไขและการตัดสินใจ"),

    # 3. Loop (Easy)
    ("multiplication-table", "การวนซ้ำและการทำซ้ำ"),
    ("sum-of-even-numbers", "การวนซ้ำและการทำซ้ำ"),
    ("factorial-calculator", "การวนซ้ำและการทำซ้ำ"),
    ("star-pyramid", "การวนซ้ำและการทำซ้ำ"),
    ("countdown-blastoff", "การวนซ้ำและการทำซ้ำ"),

    # 4. String (Easy -> Medium)
    ("reverse-a-string", "ข้อความและสตริงเมธอด"),
    ("vowel-counter", "ข้อความและสตริงเมธอด"),
    ("palindrome-checker", "ข้อความและสตริงเมธอด"),
    ("word-censor", "ข้อความและสตริงเมธอด"),
    ("acronym-generator", "ข้อความและสตริงเมธอด"),

    # 5. List (Medium)
    ("find-the-maximum-value", "ลิสต์และลิสต์เมธอด"),
    ("unique-and-sorted", "ลิสต์และลิสต์เมธอด"),
    ("filter-even-numbers", "ลิสต์และลิสต์เมธอด"),
    ("cumulative-sum", "ลิสต์และลิสต์เมธอด"),

    # 6. Dict (Medium)
    ("character-frequency", "ดิกชันนารีและคู่ข้อมูล"),
    ("word-frequency", "ดิกชันนารีและคู่ข้อมูล"),
    ("student-score-lookup", "ดิกชันนารีและคู่ข้อมูล"),

    # 7. Function (Medium)
    ("is-prime-function", "การสร้างและใช้งานฟังก์ชัน"),
    ("gcd-and-lcm", "การสร้างและใช้งานฟังก์ชัน"),
    ("fibonacci-term", "การสร้างและใช้งานฟังก์ชัน"),

    # 8. Recap (Hard)
    ("shopping-cart-bill", "แบบฝึกหัดทบทวนและโจทย์ประยุกต์"),
    ("anagram-checker", "แบบฝึกหัดทบทวนและโจทย์ประยุกต์"),
    ("student-ranking", "แบบฝึกหัดทบทวนและโจทย์ประยุกต์"),
]

SLUG_TO_ORDER = {slug: idx for idx, (slug, _) in enumerate(PROBLEM_TOPIC_CONFIG)}
SLUG_TO_TOPIC = {slug: topic for slug, topic in PROBLEM_TOPIC_CONFIG}


class CourseService:
    def __init__(self, db: Session):
        self.db = db
        self.course_repo = CourseRepository(db)

    def list_courses(
        self,
        page: int = 1,
        page_size: int = 20,
        difficulty: Optional[Difficulty] = None,
        current_user: Optional[User] = None,
        published_only: bool = True,
    ) -> Tuple[List[CourseResponse], int]:
        courses, total = self.course_repo.list_courses(
            page=page,
            page_size=page_size,
            difficulty=difficulty,
            published_only=published_only,
        )

        user_id = current_user.id if current_user else None
        course_responses = []
        for c in courses:
            total_probs, solved_probs = self.course_repo.get_problem_stats(c.id, user_id=user_id, published_only=published_only)
            pct = (solved_probs / total_probs * 100.0) if total_probs > 0 else 0.0
            course_responses.append(
                CourseResponse(
                    id=c.id,
                    title=c.title,
                    slug=c.slug,
                    description=c.description,
                    thumbnail_url=c.thumbnail_url,
                    difficulty=c.difficulty,
                    is_published=c.is_published,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                    total_problems=total_probs,
                    solved_problems=solved_probs,
                    progress_percentage=round(pct, 1),
                )
            )

        return course_responses, total

    def get_course(
        self,
        course_id: int,
        current_user: Optional[User] = None,
        published_only: bool = True,
    ) -> CourseDetailResponse:
        course = self.course_repo.get_by_id(course_id, published_only=published_only)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "COURSE_NOT_FOUND", "message": "Course not found"},
            )

        user_id = current_user.id if current_user else None
        total_probs, solved_probs = self.course_repo.get_problem_stats(course.id, user_id=user_id, published_only=published_only)
        pct = (solved_probs / total_probs * 100.0) if total_probs > 0 else 0.0

        # Load problems and sort strictly by curriculum topic order (easy -> hard)
        prob_query = self.db.query(Problem).filter(Problem.course_id == course.id)
        if published_only:
            prob_query = prob_query.filter(Problem.is_published == True)
        raw_problems = prob_query.all()
        problems = sorted(raw_problems, key=lambda p: (SLUG_TO_ORDER.get(p.slug, 9999), p.id))

        # Query user solved and starred status
        solved_problem_ids = set()
        starred_problem_ids = set()
        if user_id:
            solved_records = (
                self.db.query(UserProblemProgress.problem_id)
                .filter(UserProblemProgress.user_id == user_id, UserProblemProgress.solved == True)
                .all()
            )
            solved_problem_ids = {r[0] for r in solved_records}

            starred_records = (
                self.db.query(ProblemStar.problem_id)
                .filter(ProblemStar.user_id == user_id)
                .all()
            )
            starred_problem_ids = {r[0] for r in starred_records}

        problem_items = [
            ProblemListItemResponse(
                id=p.id,
                course_id=p.course_id,
                title=p.title,
                slug=p.slug,
                difficulty=p.difficulty,
                points=p.points,
                is_published=p.is_published,
                is_solved=p.id in solved_problem_ids,
                is_starred=p.id in starred_problem_ids,
                topic=SLUG_TO_TOPIC.get(p.slug, "ทั่วไป"),
            )
            for p in problems
        ]

        return CourseDetailResponse(
            id=course.id,
            title=course.title,
            slug=course.slug,
            description=course.description,
            thumbnail_url=course.thumbnail_url,
            difficulty=course.difficulty,
            is_published=course.is_published,
            created_at=course.created_at,
            updated_at=course.updated_at,
            total_problems=total_probs,
            solved_problems=solved_probs,
            progress_percentage=round(pct, 1),
            problems=problem_items,
        )

    def create_course(self, data: CourseCreate) -> Course:
        if self.course_repo.get_by_slug(data.slug):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "COURSE_SLUG_EXISTS", "message": f"Course with slug '{data.slug}' already exists."},
            )
        return self.course_repo.create(
            title=data.title,
            slug=data.slug,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            difficulty=data.difficulty.value if hasattr(data.difficulty, 'value') else data.difficulty,
            is_published=data.is_published,
        )

    def update_course(self, course_id: int, data: CourseUpdate) -> Course:
        course = self.course_repo.get_by_id(course_id, published_only=False)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "COURSE_NOT_FOUND", "message": "Course not found"},
            )

        if data.slug and data.slug != course.slug:
            existing = self.course_repo.get_by_slug(data.slug)
            if existing and existing.id != course.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"code": "COURSE_SLUG_EXISTS", "message": f"Course with slug '{data.slug}' already exists."},
                )

        update_dict = data.model_dump(exclude_unset=True)
        if "difficulty" in update_dict and hasattr(update_dict["difficulty"], 'value'):
            update_dict["difficulty"] = update_dict["difficulty"].value

        return self.course_repo.update(course, **update_dict)

    def delete_course(self, course_id: int) -> None:
        course = self.course_repo.get_by_id(course_id, published_only=False)
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "COURSE_NOT_FOUND", "message": "Course not found"},
            )

        # Deletion policy (§24): reject deletion if problems exist
        problem_count = self.db.query(Problem).filter(Problem.course_id == course_id).count()
        if problem_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "CANNOT_DELETE_COURSE_WITH_PROBLEMS",
                    "message": f"Cannot delete course containing {problem_count} problem(s). Delete or move problems first.",
                },
            )

        self.course_repo.delete(course)
