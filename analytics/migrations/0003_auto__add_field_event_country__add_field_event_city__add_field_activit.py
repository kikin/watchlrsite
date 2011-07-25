# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding field 'Event.country'
        db.add_column('analytics_event', 'country', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True), keep_default=False)

        # Adding field 'Event.city'
        db.add_column('analytics_event', 'city', self.gf('django.db.models.fields.CharField')(max_length=100, null=True), keep_default=False)

        # Adding field 'Activity.context'
        db.add_column('analytics_activity', 'context', self.gf('django.db.models.fields.URLField')(max_length=200, null=True), keep_default=False)

        # Adding field 'Activity.country'
        db.add_column('analytics_activity', 'country', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, db_index=True), keep_default=False)

        # Adding field 'Activity.city'
        db.add_column('analytics_activity', 'city', self.gf('django.db.models.fields.CharField')(max_length=100, null=True), keep_default=False)


    def backwards(self, orm):
        
        # Deleting field 'Event.country'
        db.delete_column('analytics_event', 'country')

        # Deleting field 'Event.city'
        db.delete_column('analytics_event', 'city')

        # Deleting field 'Activity.context'
        db.delete_column('analytics_activity', 'context')

        # Deleting field 'Activity.country'
        db.delete_column('analytics_activity', 'country')

        # Deleting field 'Activity.city'
        db.delete_column('analytics_activity', 'city')


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
            'value': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'db_index': 'True'})
        }
    }

    complete_apps = ['analytics']
