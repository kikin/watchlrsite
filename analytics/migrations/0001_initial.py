# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Activity'
        db.create_table('analytics_activity', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['api.User'])),
            ('action', self.gf('django.db.models.fields.CharField')(max_length=50, db_index=True)),
            ('secondary_id', self.gf('django.db.models.fields.PositiveIntegerField')(null=True, db_index=True)),
            ('agent', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True)),
            ('agent_version', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True)),
            ('timestamp', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
        ))
        db.send_create_signal('analytics', ['Activity'])

        # Adding model 'Event'
        db.create_table('analytics_event', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user_id', self.gf('django.db.models.fields.CharField')(max_length=20, db_index=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('value', self.gf('django.db.models.fields.IntegerField')(null=True, db_index=True)),
            ('context', self.gf('django.db.models.fields.URLField')(max_length=200, null=True)),
            ('agent', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True)),
            ('agent_version', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True)),
            ('timestamp', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
        ))
        db.send_create_signal('analytics', ['Event'])


    def backwards(self, orm):
        
        # Deleting model 'Activity'
        db.delete_table('analytics_activity')

        # Deleting model 'Event'
        db.delete_table('analytics_event')


    models = {
        'analytics.activity': {
            'Meta': {'object_name': 'Activity'},
            'action': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'secondary_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['api.User']"})
        },
        'analytics.event': {
            'Meta': {'object_name': 'Event'},
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'context': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'}),
            'value': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'db_index': 'True'})
        },
        'api.dismissedusersuggestions': {
            'Meta': {'object_name': 'DismissedUserSuggestions'},
            'dismissed_on': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'suggested_user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'+'", 'to': "orm['api.User']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'+'", 'to': "orm['api.User']"})
        },
        'api.facebookfriend': {
            'Meta': {'object_name': 'FacebookFriend'},
            'fb_friend': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'+'", 'to': "orm['api.User']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'invited_on': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'+'", 'to': "orm['api.User']"})
        },
        'api.source': {
            'Meta': {'object_name': 'Source'},
            'favicon': ('django.db.models.fields.URLField', [], {'max_length': '750', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '100'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '750'})
        },
        'api.user': {
            'Meta': {'object_name': 'User', '_ormbases': ['auth.User']},
            'campaign': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'db_index': 'True'}),
            'dismissed_user_suggestions': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'r_dismissed_user_suggestions'", 'symmetrical': 'False', 'through': "orm['api.DismissedUserSuggestions']", 'to': "orm['api.User']"}),
            'fb_friends': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'r_fb_friends'", 'symmetrical': 'False', 'through': "orm['api.FacebookFriend']", 'to': "orm['api.User']"}),
            'fb_friends_fetched': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'fb_news_feed_fetched': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'follows': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'r_follows'", 'symmetrical': 'False', 'through': "orm['api.UserFollowsUser']", 'to': "orm['api.User']"}),
            'is_registered': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'karma': ('django.db.models.fields.PositiveIntegerField', [], {'default': '0', 'db_index': 'True'}),
            'user_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['auth.User']", 'unique': 'True', 'primary_key': 'True'}),
            'videos': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['api.Video']", 'through': "orm['api.UserVideo']", 'symmetrical': 'False'})
        },
        'api.userfollowsuser': {
            'Meta': {'ordering': "['-since']", 'object_name': 'UserFollowsUser'},
            'followee': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'+'", 'to': "orm['api.User']"}),
            'follower': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'+'", 'to': "orm['api.User']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True', 'db_index': 'True'}),
            'since': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'db_index': 'True', 'blank': 'True'})
        },
        'api.uservideo': {
            'Meta': {'object_name': 'UserVideo'},
            '_position': ('django.db.models.fields.DecimalField', [], {'null': 'True', 'max_digits': '7', 'decimal_places': '2'}),
            'host': ('django.db.models.fields.URLField', [], {'max_length': '750', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'liked': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'liked_timestamp': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'db_index': 'True'}),
            'saved': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'db_index': 'True'}),
            'saved_timestamp': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'db_index': 'True'}),
            'shared_timestamp': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'db_index': 'True'}),
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
            'result': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True'}),
            'source': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'videos'", 'null': 'True', 'to': "orm['api.Source']"}),
            'task_id': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True', 'db_index': 'True'}),
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
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '254', 'blank': 'True'}),
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

    complete_apps = ['analytics']
