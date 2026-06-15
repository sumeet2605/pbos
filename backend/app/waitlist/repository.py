from sqlalchemy import func, select

from app.shared.repository import BaseRepository
from app.waitlist.models import WaitlistSignup


class WaitlistRepository(BaseRepository[WaitlistSignup]):
    model = WaitlistSignup

    async def get_by_email(self, email: str) -> WaitlistSignup | None:
        result = await self.session.execute(
            select(self.model).where(self.model.email == email)
        )
        return result.scalar_one_or_none()

    async def list_signups(
        self,
        skip: int = 0,
        limit: int = 20,
        status: str | None = None,
    ) -> tuple[list[WaitlistSignup], int]:
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if status is not None:
            query = query.where(self.model.status == status)
            count_query = count_query.where(self.model.status == status)

        query = query.order_by(self.model.created_at.desc()).offset(skip).limit(limit)

        result = await self.session.execute(query)
        count_result = await self.session.execute(count_query)

        return list(result.scalars().all()), count_result.scalar_one()
