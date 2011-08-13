# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'Error.ip_address'
        db.add_column('analytics_error', 'ip_address', self.gf('django.db.models.fields.IPAddressField')(max_length=15, null=True), keep_default=False)

        # Adding field 'Event.ip_address'
        db.add_column('analytics_event', 'ip_address', self.gf('django.db.models.fields.IPAddressField')(max_length=15, null=True), keep_default=False)

        # Adding field 'Activity.ip_address'
        db.add_column('analytics_activity', 'ip_address', self.gf('django.db.models.fields.IPAddressField')(max_length=15, null=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'Error.ip_address'
        db.delete_column('analytics_error', 'ip_address')

        # Deleting field 'Event.ip_address'
        db.delete_column('analytics_event', 'ip_address')

        # Deleting field 'Activity.ip_address'
        db.delete_column('analytics_activity', 'ip_address')


    models = {
        'analytics.activity': {
            'Meta': {'object_name': 'Activity'},
            'action': ('django.db.models.fields.CharField', [], {'max_length': '50', 'db_index': 'True'}),
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'context': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ip_address': ('django.db.models.fields.IPAddressField', [], {'max_length': '15', 'null': 'True'}),
            'secondary_id': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'})
        },
        'analytics.error': {
            'Meta': {'object_name': 'Error'},
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'context': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'exception': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ip_address': ('django.db.models.fields.IPAddressField', [], {'max_length': '15', 'null': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'message': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'})
        },
        'analytics.event': {
            'Meta': {'object_name': 'Event'},
            'agent': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'db_index': 'True'}),
            'agent_version': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'city': ('django.db.models.fields.CharField', [], {'max_length': '100', 'null': 'True'}),
            'context': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'country': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'db_index': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ip_address': ('django.db.models.fields.IPAddressField', [], {'max_length': '15', 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100', 'db_index': 'True'}),
            'timestamp': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user_id': ('django.db.models.fields.CharField', [], {'max_length': '20', 'db_index': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'db_index': 'True'})
        }
    }

    complete_apps = ['analytics']
