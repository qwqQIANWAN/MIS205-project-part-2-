import asyncio
import json
import sys
from pathlib import Path

from sqlalchemy import select

CURRENT_FILE = Path(__file__).resolve()
BACKEND_ROOT = CURRENT_FILE.parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.database import AsyncSessionLocal  # noqa: E402
from app.models.teacher import Teacher  # noqa: E402


def load_teacher_payload(file_path: Path) -> list[dict]:
    if not file_path.exists():
        raise FileNotFoundError(f"未找到老师数据文件: {file_path}")

    payload = json.loads(file_path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("老师数据文件必须是 JSON 数组")
    return payload


async def import_teachers(file_path: Path):
    teachers = load_teacher_payload(file_path)

    created_count = 0
    updated_count = 0

    async with AsyncSessionLocal() as session:
        for item in teachers:
            name = str(item.get("name", "")).strip()
            phone = str(item.get("phone", "")).strip()
            subject = str(item.get("subject", "")).strip() or None
            title = str(item.get("title", "")).strip() or None
            is_active = bool(item.get("is_active", True))

            if not name or not phone:
                raise ValueError(f"老师数据缺少 name 或 phone: {item}")

            result = await session.execute(
                select(Teacher).where(
                    Teacher.name == name,
                    Teacher.phone == phone,
                )
            )
            teacher = result.scalar_one_or_none()

            if teacher:
                teacher.subject = subject
                teacher.title = title
                teacher.is_active = is_active
                updated_count += 1
            else:
                session.add(
                    Teacher(
                        name=name,
                        phone=phone,
                        subject=subject,
                        title=title,
                        is_active=is_active,
                    )
                )
                created_count += 1

        await session.commit()

    print(f"导入完成: 新增 {created_count} 条, 更新 {updated_count} 条")


def main():
    default_file = CURRENT_FILE.with_name("teachers.sample.json")
    input_path = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else default_file
    asyncio.run(import_teachers(input_path))


if __name__ == "__main__":
    main()
