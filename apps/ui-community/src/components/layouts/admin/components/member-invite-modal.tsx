import { Modal, Form, Input, InputNumber, Button, Tabs, Space, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, UserAddOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

export interface MemberInviteModalProps {
	open: boolean;
	onClose: () => void;
	onSingleInvite: (email: string, message?: string, expiresInDays?: number) => Promise<void>;
	onBulkInvite: (invitations: Array<{ email: string; message?: string }>, expiresInDays?: number) => Promise<void>;
	loading?: boolean;
}

interface SingleInviteForm {
	email: string;
	message?: string;
	expiresInDays?: number;
}

interface BulkInviteForm {
	invitations: Array<{ email: string; message?: string }>;
	expiresInDays?: number;
}

export const MemberInviteModal: React.FC<MemberInviteModalProps> = (props) => {
	const { open, onClose, onSingleInvite, onBulkInvite, loading } = props;
	const [singleForm] = Form.useForm<SingleInviteForm>();
	const [bulkForm] = Form.useForm<BulkInviteForm>();
	const [activeTab, setActiveTab] = useState<string>('single');

	const handleCancel = () => {
		singleForm.resetFields();
		bulkForm.resetFields();
		setActiveTab('single');
		onClose();
	};

	const handleSingleSubmit = async (values: SingleInviteForm) => {
		await onSingleInvite(values.email, values.message, values.expiresInDays);
		singleForm.resetFields();
	};

	const handleBulkSubmit = async (values: BulkInviteForm) => {
		await onBulkInvite(values.invitations, values.expiresInDays);
		bulkForm.resetFields();
	};

	return (
		<Modal
			title="Invite Members"
			open={open}
			onCancel={handleCancel}
			footer={null}
			width={600}
		>
			<Tabs
				activeKey={activeTab}
				onChange={setActiveTab}
				items={[
					{
						key: 'single',
						label: (
							<span>
								<UserAddOutlined />
								Single Invitation
							</span>
						),
						children: (
							<Form
								form={singleForm}
								layout="vertical"
								onFinish={handleSingleSubmit}
								initialValues={{ expiresInDays: 7 }}
							>
								<Form.Item
									name="email"
									label="Email Address"
									rules={[
										{ required: true, message: 'Please enter an email address' },
										{ type: 'email', message: 'Please enter a valid email address' },
									]}
								>
									<Input placeholder="member@example.com" />
								</Form.Item>

								<Form.Item
									name="message"
									label="Personal Message (Optional)"
								>
									<TextArea
										rows={3}
										placeholder="Welcome to our community! We're excited to have you join us..."
										maxLength={500}
										showCount
									/>
								</Form.Item>

								<Form.Item
									name="expiresInDays"
									label="Invitation Expires In"
									tooltip="Number of days until the invitation expires"
								>
									<InputNumber
										min={1}
										max={30}
										addonAfter="days"
										style={{ width: 150 }}
									/>
								</Form.Item>

								<Divider />

								<Form.Item>
									<Space>
										<Button onClick={handleCancel}>Cancel</Button>
										<Button
											type="primary"
											htmlType="submit"
											loading={loading}
										>
											Send Invitation
										</Button>
									</Space>
								</Form.Item>
							</Form>
						),
					},
					{
						key: 'bulk',
						label: (
							<span>
								<UsergroupAddOutlined />
								Bulk Invitations
							</span>
						),
						children: (
							<Form
								form={bulkForm}
								layout="vertical"
								onFinish={handleBulkSubmit}
								initialValues={{
									invitations: [{ email: '', message: '' }],
									expiresInDays: 7,
								}}
							>
								<Text
									type="secondary"
									className="block mb-4"
								>
									Invite multiple members at once. Each invitation can have a personalized message.
								</Text>

								<Form.List name="invitations">
									{(fields, { add, remove }) => (
										<>
											{fields.map((field, index) => (
												<div
													key={field.key}
													className="mb-4 p-4 border border-gray-200 rounded"
												>
													<div className="flex justify-between items-center mb-2">
														<Text strong>Invitation #{index + 1}</Text>
														{fields.length > 1 && (
															<Button
																type="text"
																danger
																icon={<DeleteOutlined />}
																onClick={() => remove(field.name)}
																size="small"
															/>
														)}
													</div>

													<Form.Item
														{...field}
														name={[field.name, 'email']}
														rules={[
															{ required: true, message: 'Please enter an email address' },
															{ type: 'email', message: 'Please enter a valid email address' },
														]}
														label="Email Address"
													>
														<Input placeholder="member@example.com" />
													</Form.Item>

													<Form.Item
														{...field}
														name={[field.name, 'message']}
														label="Personal Message (Optional)"
													>
														<TextArea
															rows={2}
															placeholder="Custom message for this member..."
															maxLength={500}
														/>
													</Form.Item>
												</div>
											))}

											<Form.Item>
												<Button
													type="dashed"
													onClick={() => add()}
													block
													icon={<PlusOutlined />}
												>
													Add Another Invitation
												</Button>
											</Form.Item>
										</>
									)}
								</Form.List>

								<Form.Item
									name="expiresInDays"
									label="All Invitations Expire In"
									tooltip="Number of days until all invitations expire"
								>
									<InputNumber
										min={1}
										max={30}
										addonAfter="days"
										style={{ width: 150 }}
									/>
								</Form.Item>

								<Divider />

								<Form.Item>
									<Space>
										<Button onClick={handleCancel}>Cancel</Button>
										<Button
											type="primary"
											htmlType="submit"
											loading={loading}
										>
											Send All Invitations
										</Button>
									</Space>
								</Form.Item>
							</Form>
						),
					},
				]}
			/>
		</Modal>
	);
};
