/**
 * @package com.watchlr.util
 */
$.Class.extend("com.watchlr.util.Error", {

    ASSERT_OK      : 0,
    ASSERT_ERROR   : 1,
    ASSERT_WARNING : 2,
	
	assert:function(t, fn) {
		t = Boolean(t);
		if(!t && fn) fn();
		return !t;
	}
}, {});



