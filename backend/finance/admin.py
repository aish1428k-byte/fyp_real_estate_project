from django.contrib import admin
from .models import *

admin.site.register(BankAccount)
admin.site.register(Escrow)
admin.site.register(InstallmentPlan)
admin.site.register(PaymentTransaction)
admin.site.register(ReleaseRequest)
admin.site.register(PlatformWallet)