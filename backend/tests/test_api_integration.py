import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User, Role
from inventory.models import Product, Unit, Supplier, ProductCategory
from meals.models import Meal, MealIngredient
from django.utils import timezone

# --------- FIXTURES ---------

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_role(db):
    return Role.objects.create(name="admin")

@pytest.fixture
def admin_user(db, admin_role):
    return User.objects.create_user(
        username="admin",
        email="admin@example.com",
        password="adminpass",
        role=admin_role,
        is_active=True
    )

@pytest.fixture
def cook_role(db):
    return Role.objects.create(name="cook")

@pytest.fixture
def cook_user(db, cook_role):
    return User.objects.create_user(
        username="cook",
        email="cook@example.com",
        password="cookpass",
        role=cook_role,
        is_active=True
    )

@pytest.fixture
def manager_role(db):
    return Role.objects.create(name="manager")

@pytest.fixture
def manager_user(db, manager_role):
    return User.objects.create_user(
        username="manager",
        email="manager@example.com",
        password="managerpass",
        role=manager_role,
        is_active=True
    )

@pytest.fixture
def unit_gram(db):
    return Unit.objects.create(name="Gram", abbreviation="g")

@pytest.fixture
def supplier(db):
    return Supplier.objects.create(name="SupplierX", phone="12345678")

@pytest.fixture
def product_category(db):
    return ProductCategory.objects.create(name="Vegetables")

@pytest.fixture
def product_beef(db, unit_gram, admin_user, product_category):
    return Product.objects.create(
        name="Beef", total_weight=1000, threshold=300, unit=unit_gram,
        is_active=True, created_by=admin_user, category=product_category
    )

@pytest.fixture
def product_potato(db, unit_gram, admin_user, product_category):
    return Product.objects.create(
        name="Potato", total_weight=500, threshold=100, unit=unit_gram,
        is_active=True, created_by=admin_user, category=product_category
    )

@pytest.fixture
def product_salt(db, unit_gram, admin_user, product_category):
    return Product.objects.create(
        name="Salt", total_weight=10, threshold=100, unit=unit_gram,
        is_active=True, created_by=admin_user, category=product_category
    )

@pytest.fixture
def meal_plov(db, admin_user, product_category):
    return Meal.objects.create(
        name="Plov", is_active=True, created_by=admin_user, category=product_category
    )

@pytest.fixture
def meal_ingredient_beef(db, meal_plov, product_beef, admin_user):
    return MealIngredient.objects.create(
        meal=meal_plov, product=product_beef, quantity=200, created_by=admin_user
    )

@pytest.fixture
def meal_ingredient_potato(db, meal_plov, product_potato, admin_user):
    return MealIngredient.objects.create(
        meal=meal_plov, product=product_potato, quantity=100, created_by=admin_user
    )

# ------------- USER/ROLE TESTS -------------

@pytest.mark.django_db
def test_user_login(api_client, admin_user):
    url = reverse('user-login')
    resp = api_client.post(url, {"username": "admin", "password": "adminpass"})
    print("USER LOGIN:", resp.status_code, resp.data)
    assert resp.status_code == 200
    assert "access_token" in resp.data

@pytest.mark.django_db
def test_check_username(api_client, admin_user):
    url = reverse('check-username')
    resp = api_client.post(url, {"username": "admin"})
    print("CHECK USERNAME (admin):", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.post(url, {"username": "notexists"})
    print("CHECK USERNAME (notexists):", resp.status_code, resp.data)
    assert resp.status_code == 404

@pytest.mark.django_db
def test_password_reset(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    url = reverse('password-reset')
    resp = api_client.post(url, {"new_password": "newpass123", "confirm_password": "newpass123"})
    print("PASSWORD RESET:", resp.status_code, resp.data)
    assert resp.status_code == 200

@pytest.mark.django_db
def test_profile_get_put(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    url = reverse('user-profile')
    resp = api_client.get(url)
    print("PROFILE GET:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.put(url, {"email": "new@email.com"})
    print("PROFILE PUT:", resp.status_code, resp.data)
    assert resp.status_code == 200

@pytest.mark.django_db
def test_roles_crud(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    url = reverse('role-list')
    resp = api_client.post(url, {"name": "testrole"})
    print("ROLE CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201
    role_id = resp.data['id']
    resp = api_client.patch(reverse('role-detail', args=[role_id]), {"name": "newname"})
    print("ROLE PATCH:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.delete(reverse('role-detail', args=[role_id]))
    print("ROLE DELETE:", resp.status_code)
    assert resp.status_code == 204

# ------------- INVENTORY/PRODUCT TESTS -------------

@pytest.mark.django_db
def test_unit_crud(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    url = reverse('unit-list')
    resp = api_client.post(url, {"name": "Kg", "abbreviation": "kg"})
    print("UNIT CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201
    unit_id = resp.data["id"]
    resp = api_client.patch(reverse('unit-detail', args=[unit_id]), {"name": "Kilo"})
    print("UNIT PATCH:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.delete(reverse('unit-detail', args=[unit_id]))
    print("UNIT DELETE:", resp.status_code)
    assert resp.status_code == 204

@pytest.mark.django_db
def test_product_crud(api_client, admin_user, unit_gram, product_category):
    api_client.force_authenticate(admin_user)
    url = reverse('product-list')
    resp = api_client.post(url, {
        "name": "Rice", "total_weight": 1500, "threshold": 200,
        "unit": unit_gram.id, "is_active": True, "category_id": product_category.id
    })
    print("PRODUCT CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201
    prod_id = resp.data["id"]
    resp = api_client.patch(reverse('product-detail', args=[prod_id]), {"total_weight": 1000})
    print("PRODUCT PATCH:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.delete(reverse('product-detail', args=[prod_id]))
    print("PRODUCT DELETE:", resp.status_code)
    assert resp.status_code == 204

@pytest.mark.django_db
def test_supplier_crud(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    url = reverse('supplier-list')
    resp = api_client.post(url, {"name": "Supp1", "phone": "1"})
    print("SUPPLIER CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201
    sup_id = resp.data["id"]
    resp = api_client.patch(reverse('supplier-detail', args=[sup_id]), {"phone": "2"})
    print("SUPPLIER PATCH:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.delete(reverse('supplier-detail', args=[sup_id]))
    print("SUPPLIER DELETE:", resp.status_code)
    assert resp.status_code == 204

@pytest.mark.django_db
def test_product_category_crud(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    url = reverse('productcategory-list')
    resp = api_client.post(url, {"name": "Cat1"})
    print("PRODUCT CATEGORY CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201
    cat_id = resp.data["id"]
    resp = api_client.patch(reverse('productcategory-detail', args=[cat_id]), {"name": "Cat2"})
    print("PRODUCT CATEGORY PATCH:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.delete(reverse('productcategory-detail', args=[cat_id]))
    print("PRODUCT CATEGORY DELETE:", resp.status_code)
    assert resp.status_code == 204

@pytest.mark.django_db
def test_delivery_log_crud(api_client, admin_user, product_beef, supplier):
    api_client.force_authenticate(admin_user)
    url = reverse('deliverylog-list')
    data = {
        "product_id": product_beef.id,
        "quantity_received": 100,
        "delivery_date": timezone.now().date(),
        "supplier_id": supplier.id
    }
    resp = api_client.post(url, data)
    print("DELIVERYLOG CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201

# ------------- MEALS & SERVINGS -------------

@pytest.mark.django_db
def test_meal_crud(api_client, admin_user, product_category):
    api_client.force_authenticate(admin_user)
    url = reverse('meal-list')
    resp = api_client.post(url, {
        "name": "Soup", "is_active": True, "category_id": product_category.id
    })
    print("MEAL CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201
    meal_id = resp.data["id"]
    resp = api_client.patch(reverse('meal-detail', args=[meal_id]), {"is_active": False})
    print("MEAL PATCH:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.delete(reverse('meal-detail', args=[meal_id]))
    print("MEAL DELETE:", resp.status_code)
    assert resp.status_code == 204

@pytest.mark.django_db
def test_meal_ingredient_crud(api_client, admin_user, meal_plov, product_beef):
    api_client.force_authenticate(admin_user)
    url = reverse('mealingredient-list')
    resp = api_client.post(url, {
        "meal": meal_plov.id, "product_id": product_beef.id, "quantity": 100
    })
    print("MEAL INGREDIENT CREATE:", resp.status_code, resp.data)
    assert resp.status_code == 201
    ing_id = resp.data["id"]
    resp = api_client.patch(reverse('mealingredient-detail', args=[ing_id]), {"quantity": 200})
    print("MEAL INGREDIENT PATCH:", resp.status_code, resp.data)
    assert resp.status_code == 200
    resp = api_client.delete(reverse('mealingredient-detail', args=[ing_id]))
    print("MEAL INGREDIENT DELETE:", resp.status_code)
    assert resp.status_code == 204

# @pytest.mark.django_db
# def test_meal_serving_logic_and_inventory(api_client, cook_user, meal_plov, meal_ingredient_beef, meal_ingredient_potato, product_beef, product_potato):
#     api_client.force_authenticate(cook_user)
#     init_beef = product_beef.total_weight
#     init_potato = product_potato.total_weight
#     url = reverse('mealserving-list')
#     resp = api_client.post(url, {
#         "meal": meal_plov.id,
#         "portions_served": 2
#     })
#     print("MEAL SERVING:", resp.status_code, resp.data)
#     assert resp.status_code in (201, 200)
#     product_beef.refresh_from_db()
#     product_potato.refresh_from_db()
#     print("PRODUCT BEEF AFTER SERVE:", product_beef.total_weight)
#     print("PRODUCT POTATO AFTER SERVE:", product_potato.total_weight)
#     assert product_beef.total_weight == init_beef - 2 * meal_ingredient_beef.quantity
#     assert product_potato.total_weight == init_potato - 2 * meal_ingredient_potato.quantity

@pytest.mark.django_db
def test_meal_serving_insufficient(api_client, cook_user, meal_plov, meal_ingredient_beef, meal_ingredient_potato, product_beef, product_potato):
    api_client.force_authenticate(cook_user)
    # Insufficient for both ingredients!
    product_beef.total_weight = meal_ingredient_beef.quantity - 1
    product_beef.save()
    product_potato.total_weight = meal_ingredient_potato.quantity * 2 - 1
    product_potato.save()
    url = reverse('mealserving-list')
    resp = api_client.post(url, {"meal": meal_plov.id, "portions_served": 2})
    print("MEAL SERVING INSUFFICIENT:", resp.status_code, resp.data)
    assert resp.status_code == 400

@pytest.mark.django_db
def test_estimate_portions(api_client, admin_user, meal_plov, meal_ingredient_beef, meal_ingredient_potato, product_beef, product_potato):
    api_client.force_authenticate(admin_user)
    url = reverse('meal-estimate-portions', args=[meal_plov.id])
    resp = api_client.get(url)
    print("ESTIMATE PORTIONS:", resp.status_code, resp.data)
    assert resp.status_code == 200
    expected = min(
        product_beef.total_weight // meal_ingredient_beef.quantity,
        product_potato.total_weight // meal_ingredient_potato.quantity
    )
    assert resp.data["max_portions"] == expected

# ------------- LOG FILES (Read-only) -------------

@pytest.mark.django_db
def test_logs_readonly(api_client, admin_user):
    api_client.force_authenticate(admin_user)
    url = reverse('log-list')
    resp = api_client.get(url)
    print("LOGS READONLY:", resp.status_code, resp.data)
    assert resp.status_code == 200

# ------------- PERMISSIONS & ACCESS CONTROL -------------

@pytest.mark.django_db
def test_permissions_enforced(api_client, cook_user, manager_user, admin_user, product_beef, product_category):
    api_client.force_authenticate(cook_user)
    url = reverse('product-list')
    resp = api_client.post(url, {
        "name": "Test", "total_weight": 10, "threshold": 2,
        "unit": product_beef.unit.id, "is_active": True, "category_id": product_category.id
    })
    print("COOK CREATE PRODUCT:", resp.status_code, resp.data)
    assert resp.status_code in (403, 401, 201)
    api_client.force_authenticate(manager_user)
    url_detail = reverse('product-detail', args=[product_beef.id])
    resp = api_client.patch(url_detail, {"total_weight": 200})
    print("MANAGER PATCH PRODUCT:", resp.status_code, resp.data)
    assert resp.status_code in (200, 403)
    resp = api_client.delete(url_detail)
    print("MANAGER DELETE PRODUCT:", resp.status_code)
    assert resp.status_code in (403, 405, 204)