# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Source'
        db.create_table('api_source', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=100)),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=750)),
            ('favicon', self.gf('django.db.models.fields.URLField')(max_length=750, null=True)),
        ))
        db.send_create_signal('api', ['Source'])

        # Adding model 'Video'
        db.create_table('api_video', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=750, db_index=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, db_index=True)),
            ('description', self.gf('django.db.models.fields.TextField')(max_length=3000, null=True)),
            ('html_embed_code', self.gf('django.db.models.fields.TextField')(max_length=3000, null=True)),
            ('html5_embed_code', self.gf('django.db.models.fields.TextField')(max_length=3000, null=True)),
            ('source', self.gf('django.db.models.fields.related.ForeignKey')(related_name='videos', null=True, to=orm['api.Source'])),
            ('fetched', self.gf('django.db.models.fields.DateTimeField')(null=True, db_index=True)),
        ))
        db.send_create_signal('api', ['Video'])

        # Adding model 'Thumbnail'
        db.create_table('api_thumbnail', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('video', self.gf('django.db.models.fields.related.ForeignKey')(related_name='thumbnails', to=orm['api.Video'])),
            ('type', self.gf('django.db.models.fields.CharField')(default='web', max_length=10)),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=750)),
            ('width', self.gf('django.db.models.fields.IntegerField')()),
            ('height', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('api', ['Thumbnail'])

        # Adding model 'User'
        db.create_table('api_user', (
            ('user_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['auth.User'], unique=True, primary_key=True)),
        ))
        db.send_create_signal('api', ['User'])

        # Adding model 'UserFollowsUser'
        db.create_table('api_userfollowsuser', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('follower', self.gf('django.db.models.fields.related.ForeignKey')(related_name='follower_set', to=orm['api.User'])),
            ('followee', self.gf('django.db.models.fields.related.ForeignKey')(related_name='followeee_set', to=orm['api.User'])),
            ('since', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, db_index=True, blank=True)),
        ))
        db.send_create_signal('api', ['UserFollowsUser'])

        # Adding model 'UserVideo'
        db.create_table('api_uservideo', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['api.User'])),
            ('video', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['api.Video'])),
            ('host', self.gf('django.db.models.fields.URLField')(max_length=750, null=True)),
            ('saved', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True)),
            ('saved_timestamp', self.gf('django.db.models.fields.DateTimeField')(null=True, db_index=True)),
            ('liked', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True)),
            ('liked_timestamp', self.gf('django.db.models.fields.DateTimeField')(null=True, db_index=True)),
            ('watched', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True)),
            ('watched_timestamp', self.gf('django.db.models.fields.DateTimeField')(null=True, db_index=True)),
            ('position', self.gf('django.db.models.fields.DecimalField')(null=True, max_digits=5, decimal_places=2)),
        ))
        db.send_create_signal('api', ['UserVideo'])

        # Adding model 'Notification'
        db.create_table('api_notification', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['api.User'])),
            ('message', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('archived', self.gf('django.db.models.fields.BooleanField')(default=False, db_index=True)),
            ('changed', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
        ))
        db.send_create_signal('api', ['Notification'])

        # Adding model 'Preference'
        db.create_table('api_preference', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['api.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('value', self.gf('django.db.models.fields.PositiveSmallIntegerField')()),
            ('changed', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
        ))
        db.send_create_signal('api', ['Preference'])


    def backwards(self, orm):
        
        # Deleting model 'Source'
        db.delete_table('api_source')

        # Deleting model 'Video'
        db.delete_table('api_video')

        # Deleting model 'Thumbnail'
        db.delete_table('api_thumbnail')

        # Deleting model 'User'
        db.delete_table('api_user')

        # Deleting model 'UserFollowsUser'
        db.delete_table('api_userfollowsuser')

        # Deleting model 'UserVideo'
        db.delete_table('api_uservideo')

        # Deleting model 'Notification'
        db.delete_table('api_notification')

        # Deleting model 'Preference'
        db.delete_table('api_preference')


    models = {
        'api.notification': {
            'Meta': {'object_name': 'Notification'},
            'archived': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'changed': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'message': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['api.User']"})
        },
        'api.preference': {
            'Meta': {'object_name': 'Preference'},
            'changed': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['api.User']"}),
            'value': ('django.db.models.fields.PositiveSmallIntegerField', [], {})
        },
        'api.source': {
            'Meta': {'object_name': 'Source'},
            'favicon': ('django.db.models.fields.URLField', [], {'max_length': '750', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '750'})
        },
        'api.thumbnail': {
            'Meta': {'object_name': 'Thumbnail'},
            'height': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'default': "'web'", 'max_length': '10'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '750'}),
            'video': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'thumbnails'", 'to': "orm['api.Video']"}),
            'width': ('django.db.models.fields.IntegerField', [], {})
        },
        'api.user': {
            'Meta': {'object_name': 'User', '_ormbases': ['auth.User']},
            'follows': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['api.User']", 'through': "orm['api.UserFollowsUser']", 'symmetrical': 'False'}),
            'user_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['auth.User']", 'unique': 'True', 'primary_key': 'True'}),
            'videos': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['api.Video']", 'through': "orm['api.UserVideo']", 'symmetrical': 'False'})
        },
        'api.userfollowsuser': {
            'Meta': {'ordering': "['-since']", 'object_name': 'UserFollowsUser'},
            'followee': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'followeee_set'", 'to': "orm['api.User']"}),
            'follower': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'follower_set'", 'to': "orm['api.User']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'since': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'db_index': 'True', 'blank': 'True'})
        },
        'api.uservideo': {
            'Meta': {'object_name': 'UserVideo'},
            'host': ('django.db.models.fields.URLField', [], {'max_length': '750', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'liked': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'liked_timestamp': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'db_index': 'True'}),
            'position': ('django.db.models.fields.DecimalField', [], {'null': 'True', 'max_digits': '5', 'decimal_places': '2'}),
            'saved': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'saved_timestamp': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'db_index': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['api.User']"}),
            'video': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['api.Video']"}),
            'watched': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'watched_timestamp': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'db_index': 'True'})
        },
        'api.video': {
            'Meta': {'object_name': 'Video'},
            'description': ('django.db.models.fields.TextField', [], {'max_length': '3000', 'null': 'True'}),
            'fetched': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'db_index': 'True'}),
            'html5_embed_code': ('django.db.models.fields.TextField', [], {'max_length': '3000', 'null': 'True'}),
            'html_embed_code': ('django.db.models.fields.TextField', [], {'max_length': '3000', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'videos'", 'null': 'True', 'to': "orm['api.Source']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'db_index': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '750', 'db_index': 'True'})
        },
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['api']
