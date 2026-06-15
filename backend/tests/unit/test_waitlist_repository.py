import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.waitlist.models import WaitlistSignup
from app.waitlist.repository import WaitlistRepository


@pytest.mark.asyncio
async def test_create_and_get_by_email(db_session: AsyncSession) -> None:
    repo = WaitlistRepository(db_session)

    signup = await repo.create(
        name="Unit Tester",
        email="unit@example.com",
        phone="+91 99900 00001",
        status="new",
    )

    found = await repo.get_by_email("unit@example.com")

    assert found is not None
    assert found.id == signup.id
    assert found.name == "Unit Tester"
    assert found.status == "new"


@pytest.mark.asyncio
async def test_get_by_email_not_found(db_session: AsyncSession) -> None:
    repo = WaitlistRepository(db_session)

    result = await repo.get_by_email("ghost@example.com")

    assert result is None


@pytest.mark.asyncio
async def test_list_signups_returns_all(db_session: AsyncSession) -> None:
    repo = WaitlistRepository(db_session)

    await repo.create(name="A", email="list-a@example.com", phone="+1", status="new")
    await repo.create(name="B", email="list-b@example.com", phone="+2", status="new")

    signups, total = await repo.list_signups(skip=0, limit=10)

    assert total >= 2
    assert len(signups) >= 2


@pytest.mark.asyncio
async def test_list_signups_status_filter(db_session: AsyncSession) -> None:
    repo = WaitlistRepository(db_session)

    db_session.add(
        WaitlistSignup(name="New", email="filtertest-new@example.com", phone="+3", status="new")
    )
    db_session.add(
        WaitlistSignup(
            name="Contacted", email="filtertest-cont@example.com", phone="+4", status="contacted"
        )
    )
    await db_session.flush()

    signups, _total = await repo.list_signups(skip=0, limit=10, status="contacted")

    for s in signups:
        assert s.status == "contacted"


@pytest.mark.asyncio
async def test_list_signups_pagination(db_session: AsyncSession) -> None:
    repo = WaitlistRepository(db_session)

    for i in range(5):
        db_session.add(
            WaitlistSignup(
                name=f"Page {i}", email=f"page-{i}@example.com", phone=f"+{i + 10}", status="new"
            )
        )
    await db_session.flush()

    page1, total = await repo.list_signups(skip=0, limit=2)
    page2, _ = await repo.list_signups(skip=2, limit=2)

    assert total >= 5
    assert len(page1) == 2
    assert len(page2) == 2
    page1_ids = {s.id for s in page1}
    page2_ids = {s.id for s in page2}
    assert page1_ids.isdisjoint(page2_ids)
