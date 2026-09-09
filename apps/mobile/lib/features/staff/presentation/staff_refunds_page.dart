import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/staff_refund_case.dart';
import 'staff_providers.dart';
import 'staff_ui_theme.dart';

class StaffRefundsPage extends ConsumerStatefulWidget {
  const StaffRefundsPage({super.key});
  @override ConsumerState<StaffRefundsPage> createState() => _StaffRefundsPageState();
}

class _StaffRefundsPageState extends ConsumerState<StaffRefundsPage> {
  static const _statuses = ['ALL','REQUESTED','PROCESSING','REFUNDED','REJECTED','FAILED'];
  List<StaffRefundCase> _cases = const [];
  String _status = 'REQUESTED';
  String? _busyId, _error;
  bool _loading = true;

  @override void initState(){ super.initState(); Future<void>.microtask(_load); }
  Future<void> _load() async {
    if (!mounted) return; setState(() { _loading=true; _error=null; });
    try { final data=await ref.read(staffRepositoryProvider).getRefunds(status:_status); if(mounted)setState(()=>_cases=data); }
    catch(e){ if(mounted)setState(()=>_error=_message(e)); } finally { if(mounted)setState(()=>_loading=false); }
  }
  String _message(Object e){ if(e is DioException && e.response?.data is Map<String,dynamic>){ final m=(e.response!.data as Map<String,dynamic>)['message']; if(m is String)return m; } return 'Refund action failed.'; }
  String _money(StaffRefundCase e)=>'${e.currency} ${(e.amountCents/100).toStringAsFixed(2)}';
  Future<void> _approve(StaffRefundCase e) async {
    final ok=await showDialog<bool>(context:context,builder:(c)=>AlertDialog(title:const Text('Approve refund?'),content:Text('Approve ${_money(e)} for order ${e.orderNumber}? This will send the refund to the original payment provider.'),actions:[TextButton(onPressed:()=>Navigator.pop(c,false),child:const Text('Cancel')),FilledButton(onPressed:()=>Navigator.pop(c,true),child:const Text('Approve refund'))]));
    if(ok!=true||!mounted)return; await _run(e,()=>ref.read(staffRepositoryProvider).approveRefund(e.id));
  }
  Future<void> _reject(StaffRefundCase e) async {
    final controller=TextEditingController();
    final ok=await showDialog<bool>(context:context,builder:(c)=>AlertDialog(title:const Text('Reject refund request'),content:TextField(controller:controller,minLines:2,maxLines:4,decoration:const InputDecoration(labelText:'Reason / staff note')),actions:[TextButton(onPressed:()=>Navigator.pop(c,false),child:const Text('Cancel')),FilledButton(onPressed:()=>Navigator.pop(c,true),child:const Text('Reject'))]));
    final note=controller.text.trim(); controller.dispose(); if(ok!=true||!mounted)return; await _run(e,()=>ref.read(staffRepositoryProvider).rejectRefund(e.id,note:note));
  }
  Future<void> _run(StaffRefundCase e,Future<void> Function() action) async { if(_busyId!=null)return; setState(()=>_busyId=e.id); try{await action();await _load();}catch(x){if(mounted)setState(()=>_error=_message(x));}finally{if(mounted)setState(()=>_busyId=null);} }
  @override Widget build(BuildContext context)=>StaffUiTheme(child:Scaffold(appBar:AppBar(title:const Text('Refund approvals'),actions:[IconButton(onPressed:_loading?null:_load,icon:const Icon(Icons.refresh_rounded))]),body:RefreshIndicator(onRefresh:_load,child:ListView(padding:const EdgeInsets.all(20),physics:const AlwaysScrollableScrollPhysics(),children:[
    DropdownButtonFormField<String>(initialValue:_status,decoration:const InputDecoration(labelText:'Status'),items:_statuses.map((s)=>DropdownMenuItem(value:s,child:Text(s))).toList(),onChanged:(v){if(v!=null){setState(()=>_status=v);_load();}}),
    if(_error!=null)...[const SizedBox(height:12),Card(child:Padding(padding:const EdgeInsets.all(14),child:Text(_error!)))],const SizedBox(height:14),
    if(_loading&&_cases.isEmpty)const Padding(padding:EdgeInsets.all(48),child:Center(child:CircularProgressIndicator())) else if(_cases.isEmpty)const Padding(padding:EdgeInsets.all(48),child:Center(child:Text('No refund requests match this filter.'))) else ..._cases.map((e)=>Card(child:Padding(padding:const EdgeInsets.all(16),child:Column(crossAxisAlignment:CrossAxisAlignment.start,children:[Row(children:[Expanded(child:Text(e.orderNumber,style:Theme.of(context).textTheme.titleMedium)),Chip(label:Text(e.status))]),const SizedBox(height:8),Text('${e.customerName} · ${e.email}'),Text('${_money(e)} · ${e.provider}'),const SizedBox(height:8),Text('Reason: ${e.reason}'),if(e.customerNote?.isNotEmpty??false)Text('Customer note: ${e.customerNote}'),if(e.failureMessage?.isNotEmpty??false)Text('Note: ${e.failureMessage}'),if(e.status=='REQUESTED')...[const SizedBox(height:12),Row(children:[Expanded(child:OutlinedButton(onPressed:_busyId==e.id?null:()=>_reject(e),child:const Text('Reject'))),const SizedBox(width:10),Expanded(child:FilledButton(onPressed:_busyId==e.id?null:()=>_approve(e),child:Text(_busyId==e.id?'Working…':'Approve')))])]]))))
  ]))));
}
