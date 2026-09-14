from pydantic import BaseModal, Field


class CategoryBase(BaseModal):
    name: str = Field(..., min_length=5, max_length=100, description="Category name")
    slug: str = Field(..., min_length=5, max_length=100, description="URL-friendly category name")

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int = Field(..., description='Unique category identifier')

    class Config:
        form_attributes = True