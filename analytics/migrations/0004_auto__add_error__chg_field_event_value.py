# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Error'
        db.create_table('analytics_error', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('agent', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True)),
            ('agent_version', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True)),
            ('context', self.gf('django.db.models.fields.URLField')(max_length=200, null=True)),
            ('country', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True)),
            ('city', self.gf('django.db.models.fields.CharField')(max_length=100, null=True)),
            ('timestamp', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('user_id', self.gf('django.db.models.fields.CharField')(max_length=20, db_index=True)),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=100, db_index=True)),
            ('message', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, db_index=True)),
            ('exception', self.gf('django.db.models.fields.CharField')(max_length=500, null=True)),
        ))
        db.send_create_signal('analytics', ['Error'])

        # Changing field 'Event.value'
        db.alter_column('analytics_event', 'value', self.gf('django.db.models.fields.CharField')(max_length=250, null=True))


    def backwards(self, orm):
        
        # Deleting model 'Error'
        db.delete_table('analytics_error')

        # Changing field 'Event.value'
        db.alter_column('analytics_event', 'value', self.gf('django.db.models.fields.IntegerField')(null=True))


    models = {
        'analytics.activity': {
            'Meta': {'object_name': 'Activity'},
            'action': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'context': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'secondary_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'})
        },
        'analytics.error': {
            'Meta': {'object_name': 'Error'},
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'context': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'exception': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'message': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'})
        },
        'analytics.event': {
            'Meta': {'object_name': 'Event'},
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'context': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'db_index': 'True'})
        }
    }

    complete_apps = ['analytics']
