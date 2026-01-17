from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_user_flag_reason'),
    ]

    operations = [
        migrations.AlterField(
            model_name='certification',
            name='cert_name',
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name='certification',
            name='issuing_organization',
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name='education',
            name='degree',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='education',
            name='specialization',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='education',
            name='university',
            field=models.TextField(blank=True, null=True),
        ),
    ]
