from django.urls import include, path
from products.views import *
from purchase.views import (CartOperations, DoCheckout, GetPaymentUrl,
                            ValidatingTransaction, WordpressCart)

urlpatterns = [
    path('cart', CartOperations.as_view(), name='Cart'),
    path('wordpress_cart', WordpressCart.as_view(), name="wordpress cart"),
    path('cart/<uuid:cart_id>', CartOperations.as_view(), name='Cart delete'),
    # path('payment_url', GetPaymentUrl.as_view(), name='login'),
    path('checkout', DoCheckout.as_view(), name='checkout'),
    path('validate_transaction', ValidatingTransaction.as_view(),
         name='validate_transaction'),
]
